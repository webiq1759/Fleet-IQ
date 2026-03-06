
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { ToastContainer, ToastMessage } from '../components/Toast';

interface NotificationContextType {
  addToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  unreadCount: number;
  unreadMessageCount: number;
  notifications: any[]; // Exposed for UI components
  clearUnread: () => void;
  markAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  refreshUnreadMessageCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUnread = useCallback(async () => {
    if (!userId) return;

    // Fetch notifications unread
    const { count: notifCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (notifCount !== null) setUnreadCount(notifCount);

    // Fetch messages unread
    const { count: msgCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_id', userId); // RLS ensures we only see messages in our conversations

    if (msgCount !== null) setUnreadMessageCount(msgCount);

  }, [userId]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
    }
  }, [userId]);

  // Fetch initial data
  useEffect(() => {
    fetchUnread();
    fetchNotifications();
  }, [fetchUnread, fetchNotifications]);

  const addToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearUnread = useCallback(() => setUnreadCount(0), []);

  const refreshUnreadCount = useCallback(async () => {
    await fetchUnread();
    await fetchNotifications();
  }, [fetchUnread, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    fetchUnread(); // Ensure sync
  }, [fetchUnread]);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
    fetchUnread();
  }, [fetchUnread]);

  const clearAllNotifications = useCallback(async () => {
    if (!userId) return;
    setNotifications([]);
    setUnreadCount(0);
    await supabase.from('notifications').delete().eq('user_id', userId);
    fetchUnread();
  }, [userId, fetchUnread]);

  const decrementUnread = useCallback(() => setUnreadCount(prev => Math.max(0, prev - 1)), []);

  useEffect(() => {
    if (!userId) return;

    const playNotificationSound = () => {
      try {
        const audio = new Audio('/sounds/tap_new.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play failed', e));
      } catch (e) { console.error(e); }
    };

    // Unified Subscription for Notifications Table
    const notificationsChannel = supabase
      .channel('public:notifications:' + userId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as any;
            setNotifications(prev => {
              if (prev.some(n => n.id === newNotif.id)) return prev;
              return [newNotif, ...prev];
            });
            setUnreadCount(c => c + 1);
            addToast(newNotif.title, newNotif.message, newNotif.type);
            playNotificationSound();
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any;
            setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n));
            fetchUnread();
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setNotifications(prev => prev.filter(n => n.id !== deletedId));
            fetchUnread();
          }
        }
      )
      .subscribe();

    // Message Listeners
    const chatChannel = supabase
      .channel('public:messages_global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as any;
            if (newMsg.sender_id !== userId) {
              // Determine if this message is for me (RLS allows me to see it, and sender is not me)
              // We increment unread count.
              // We DO NOT show toast here because the sender (Messages.tsx) inserts a Notification which triggers the other listener.
              setUnreadMessageCount(prev => prev + 1);
              playNotificationSound();
            }
          } else if (payload.eventType === 'UPDATE') {
            // Handle is_read changes
            const newMsg = payload.new as any;
            const oldMsg = payload.old as any;
            if (newMsg.sender_id !== userId) {
              if (oldMsg.is_read === false && newMsg.is_read === true) {
                setUnreadMessageCount(prev => Math.max(0, prev - 1));
              }
              // If marked unread (rare)
              if (oldMsg.is_read === true && newMsg.is_read === false) {
                setUnreadMessageCount(prev => prev + 1);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [userId, addToast, fetchUnread]);

  return (
    <NotificationContext.Provider value={{
      addToast,
      unreadCount,
      unreadMessageCount,
      notifications,
      clearUnread,
      markAsRead,
      deleteNotification,
      clearAllNotifications,
      refreshUnreadCount,
      refreshUnreadMessageCount: fetchUnread // Expose specifically if needed, or just use refreshUnreadCount
    }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
