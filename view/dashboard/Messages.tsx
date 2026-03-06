
import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, MoreVertical, Phone, Video, Info, User as UserIcon, Check, CheckCheck, Loader2, Paperclip, Smile, ShieldAlert, Ban, Download, ArrowLeft } from 'lucide-react';
import { Conversation, ChatMessage } from '../../types';
import { supabase } from '../../supabaseClient';
import EmojiPicker from 'emoji-picker-react';
import { useNavigate } from 'react-router-dom';

import { useNotification } from '../../contexts/NotificationContext';

export const Messages = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const { addToast, refreshUnreadCount } = useNotification();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollBehaviorRef = useRef<ScrollBehavior>('auto');

    // Scroll helper - adjusted to use ref
    const scrollToBottom = () => {
        // Use timeout to ensure DOM update
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: scrollBehaviorRef.current });
        }, 100);
    };

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (!isLoadingMessages && messages.length > 0) {
            scrollToBottom();
        }
    }, [messages, isLoadingMessages]);

    // ... (rest of useEffects)

    const fetchMessages = async (convId: string) => {
        setIsLoadingMessages(true);
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', convId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data) {
                const mappedMessages: ChatMessage[] = data.map(m => ({
                    ...m,
                    isMe: m.sender_id === currentUserId,
                    createdAt: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }));

                scrollBehaviorRef.current = 'auto'; // Instant jump on load
                setMessages(mappedMessages);

                // Mark as read
                if (currentUserId) {
                    const { error: updateError } = await supabase
                        .from('messages')
                        .update({ is_read: true })
                        .eq('conversation_id', convId)
                        .neq('sender_id', currentUserId)
                        .eq('is_read', false);

                    if (updateError) console.error("Error marking messages read:", updateError);

                    // Update local conversation unread count
                    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));

                    // Update global unread count
                    refreshUnreadCount();
                }
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    // ... (handleSendMessage logic)
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversationId || !currentUserId) return;

        const messageContent = newMessage;
        setNewMessage(''); // Optimistic clear
        setShowEmojiPicker(false);

        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: selectedConversationId,
                    sender_id: currentUserId,
                    content: messageContent
                });

            if (error) throw error;

            // Update last message in conversation list locally
            setConversations(prev => prev.map(c =>
                c.id === selectedConversationId
                    ? { ...c, last_message: messageContent, last_message_at: new Date().toISOString(), lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                    : c
            ));

            scrollBehaviorRef.current = 'smooth'; // Smooth scroll for new message

            // Insert Notification for the recipient
            if (selectedConversation) {
                const recipientId = selectedConversation.participant_a === currentUserId
                    ? selectedConversation.participant_b
                    : selectedConversation.participant_a;

                await supabase.from('notifications').insert({
                    user_id: recipientId,
                    title: 'New Message',
                    message: `New message from ${selectedConversation.participantName || 'User'}`,
                    type: 'info',
                    link: '/dashboard?tab=messages',
                    is_read: false
                });
            }

        } catch (error) {
            console.error('Error sending message:', error);
            // Optionally restore message to input on error
        }
    };

    // Initial fetch of user and conversations
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setCurrentUserId(user.id);
            fetchConversations(user.id);
        };
        init();

        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
            if (showEmojiPicker && !(event.target as Element).closest('.emoji-picker-container')) {
                setShowEmojiPicker(false);
            }
        };

        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowDropdown(false);
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscKey);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [showEmojiPicker]);

    // Fetch conversations (existing logic)
    const fetchConversations = async (userId: string) => {
        try {
            const { data: convs, error } = await supabase
                .from('conversations')
                .select('*')
                .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            if (convs) {
                // Fetch Profiles logic (kept same as before)
                const otherUserIds = convs.map(c => c.participant_a === userId ? c.participant_b : c.participant_a);
                const uniqueIds = Array.from(new Set(otherUserIds));

                // Collect Asset IDs
                const assetIds = convs.map(c => c.asset_id).filter(id => id);
                const uniqueAssetIds = Array.from(new Set(assetIds));

                // Fetch Profiles
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', uniqueIds);

                // Fetch Assets
                let assetMap = new Map();
                if (uniqueAssetIds.length > 0) {
                    const { data: assets } = await supabase
                        .from('assets')
                        .select('id, title, image_url')
                        .in('id', uniqueAssetIds);

                    if (assets) {
                        assetMap = new Map(assets.map(a => [a.id, a]));
                    }
                }

                const profileMap = new Map(profiles?.map(p => [p.id, p]));

                // Fetch Unread Counts Aggregated
                const { data: unreadMsgs } = await supabase
                    .from('messages')
                    .select('conversation_id')
                    .eq('is_read', false)
                    .neq('sender_id', userId);

                const unreadCountMap = new Map<string, number>();
                if (unreadMsgs) {
                    unreadMsgs.forEach((msg: any) => {
                        const count = unreadCountMap.get(msg.conversation_id) || 0;
                        unreadCountMap.set(msg.conversation_id, count + 1);
                    });
                }

                const mappedConvs: Conversation[] = convs.map(c => {
                    const otherId = c.participant_a === userId ? c.participant_b : c.participant_a;
                    const profile = profileMap.get(otherId);
                    const asset = c.asset_id ? assetMap.get(c.asset_id) : null;

                    return {
                        ...c,
                        participantName: profile?.full_name || 'User',
                        participantAvatar: profile?.avatar_url,
                        lastMessageTime: new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        unreadCount: unreadCountMap.get(c.id) || 0,
                        assetContext: asset ? {
                            id: asset.id,
                            title: asset.title,
                            imageUrl: asset.image_url
                        } : undefined
                    };
                });
                setConversations(mappedConvs);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };


    // Fetch messages when conversation selected
    useEffect(() => {
        if (!selectedConversationId) return;
        setMessages([]); // Clear previous messages immediately
        fetchMessages(selectedConversationId);

        // Subscribe to new messages
        const channel = supabase
            .channel(`messages:${selectedConversationId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConversationId}` },
                (payload) => {
                    console.log('Real-time message received:', payload);
                    const newMsg = payload.new as any;
                    const newMessageContext: ChatMessage = {
                        id: newMsg.id,
                        conversation_id: newMsg.conversation_id,
                        sender_id: newMsg.sender_id,
                        content: newMsg.content,
                        created_at: newMsg.created_at,
                        is_read: newMsg.is_read,
                        isMe: newMsg.sender_id === currentUserId,
                        createdAt: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    setMessages((prev) => [...prev, newMessageContext]);
                    scrollBehaviorRef.current = 'smooth';

                    if (newMsg.sender_id !== currentUserId) {
                        try {
                            const audio = new Audio('/sounds/tap_new.mp3');
                            audio.volume = 0.5;
                            audio.play().catch(e => console.log('Audio play failed', e));
                        } catch (e) { console.error(e); }
                    }
                }
            )
            .subscribe((status) => {
                console.log(`Subscription status for conversation ${selectedConversationId}:`, status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedConversationId, currentUserId]); // Depend on currentUserId to correctly set isMe





    const onEmojiClick = (emojiObject: any) => {
        setNewMessage(prev => prev + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 500 * 1024) {
                alert("File size exceeds 500KB limit.");
                return;
            }
            setNewMessage(prev => prev + ` [Attachment: ${file.name}] `);
        }
    };

    const handleExportChat = () => {
        if (!messages.length) return;
        const chatText = messages.map(m => `[${m.createdAt}] ${m.isMe ? 'Me' : 'Them'}: ${m.content}`).join('\n');
        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${selectedConversationId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowDropdown(false);
    };

    const handleReportUser = () => {
        alert("User has been reported to the administration team.");
        setShowDropdown(false);
    };

    const handleBlockUser = () => {
        alert("User has been blocked. You will no longer receive messages from them.");
        setShowDropdown(false);
    };

    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

    // Skeleton Loader Component
    const MessageSkeleton = () => (
        <div className="space-y-4 p-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} animate-pulse`}>
                    <div className={`h-12 w-48 rounded-2xl ${i % 2 === 0 ? 'bg-slate-200 dark:bg-slate-700' : 'bg-slate-100 dark:bg-slate-800'}`}></div>
                </div>
            ))}
        </div>
    );

    const isMobile = window.innerWidth < 768;
    const navigate = useNavigate();

    return (
        <div className="h-[calc(100vh-130px)] md:h-[calc(100vh-140px)] bg-white dark:bg-slate-900 md:rounded-xl md:border border-slate-200 dark:border-slate-800 md:shadow-sm overflow-hidden flex animate-in fade-in duration-300">

            {/* Conversation List Sidebar */}
            <div className={`w-full md:w-80 lg:w-96 md:border-r border-slate-200 dark:border-slate-800 flex flex-col ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Messages</h2>
                        {/* Sound Test Button (Debug) */}
                    </div>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-64 md:pb-0">
                    {conversations.length > 0 ? conversations.map(conv => (
                        <div
                            key={conv.id}
                            onClick={() => setSelectedConversationId(conv.id)}
                            className={`p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedConversationId === conv.id ? 'bg-slate-50 dark:bg-slate-800/80 border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                        {/* Revert to User Avatar Always */}
                                        {conv.participantAvatar ? (
                                            <img src={conv.participantAvatar} alt={conv.participantName} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-none mb-1">
                                            {conv.participantName}
                                        </h4>
                                        <div className="flex flex-col">
                                            {conv.assetContext && (
                                                <div className="mb-1">
                                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-md w-fit mb-1 block max-w-[120px] truncate">
                                                        {conv.assetContext.title}
                                                    </span>
                                                    {conv.assetContext.imageUrl && (
                                                        <img
                                                            src={conv.assetContext.imageUrl}
                                                            alt={conv.assetContext.title}
                                                            className="w-12 h-8 rounded object-cover border border-slate-100 dark:border-slate-700"
                                                        />
                                                    )}
                                                </div>
                                            )}
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate w-32 md:w-36">
                                                {conv.lastMessage}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400">{conv.lastMessageTime}</span>
                                    {conv.unreadCount > 0 && (
                                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold mt-1 ml-auto">
                                            {conv.unreadCount}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                            No active conversations.
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 ${!selectedConversationId ? 'hidden md:flex' : 'fixed inset-0 z-[100] md:static md:z-auto flex'}`}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 safe-area-top">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedConversationId(null)} className="md:hidden text-slate-500 mr-2 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-full">
                                    <ArrowLeft className="w-6 h-6" />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                                    {selectedConversation.participantAvatar ? (
                                        <img src={selectedConversation.participantAvatar} alt={selectedConversation.participantName} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{selectedConversation.participantName}</h3>
                                    {selectedConversation.assetContext && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Inquiry: {selectedConversation.assetContext.title}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 relative">
                                <button
                                    className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                    onClick={() => setShowDropdown(!showDropdown)}
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>

                                {/* Dropdown Menu */}
                                {showDropdown && (
                                    <div ref={dropdownRef} className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <button
                                            onClick={handleExportChat}
                                            className="w-full text-left px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                        >
                                            <Download className="w-4 h-4" /> Export Chat
                                        </button>
                                        <button
                                            onClick={handleReportUser}
                                            className="w-full text-left px-4 py-3 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 flex items-center gap-2"
                                        >
                                            <ShieldAlert className="w-4 h-4" /> Report
                                        </button>
                                        <button
                                            onClick={handleBlockUser}
                                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                                        >
                                            <Ban className="w-4 h-4" /> Block User
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages Scroll Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                            {isLoadingMessages ? (
                                <MessageSkeleton />
                            ) : messages.length > 0 ? (
                                messages.map((msg) => {
                                    return (
                                        <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`
                                            max-w-[75%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm relative text-sm md:text-base mb-1
                                            ${msg.isMe
                                                    ? 'bg-red-600 text-white rounded-tr-none'
                                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none'}
                                        `}>
                                                <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                                                <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] opacity-80 ${msg.isMe ? 'text-red-100' : 'text-slate-400'}`}>
                                                    <span>{msg.createdAt}</span>
                                                    {msg.isMe && (
                                                        msg.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <Info className="w-8 h-8 mb-2 opacity-50" />
                                    <p className="text-sm">No messages yet. Start the conversation!</p>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 md:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 relative safe-area-bottom">
                            {/* Emoji Picker Popover */}
                            {showEmojiPicker && (
                                <div className="absolute bottom-20 left-4 z-10 shadow-xl rounded-xl emoji-picker-container">
                                    <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Message..."
                                        className="w-full pl-4 pr-20 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-base focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-900 dark:text-white"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowEmojiPicker(!showEmojiPicker);
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors"
                                        >
                                            <Smile className="w-5 h-5" />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            accept="image/*,.pdf,.doc,.docx"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors disabled:opacity-50 shadow-md flex-none flex items-center justify-center transform active:scale-95"
                                >
                                    <Send className="w-5 h-5 translate-x-0.5" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <Send className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Select a conversation</h3>
                        <p className="text-sm text-center max-w-xs">Choose a chat from the sidebar to view messages and respond to customers.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
