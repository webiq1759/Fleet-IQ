import React, { Fragment } from 'react';
import { Bell, Check, Info, AlertTriangle, AlertCircle, X, Trash2, ArrowLeft } from 'lucide-react';
import { Popover, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'action_required';
    link?: string;
    is_read: boolean;
    created_at: string;
}

export const NotificationCenter = () => {
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        markAsRead,
        deleteNotification,
        clearAllNotifications
    } = useNotification();

    const handleNotificationClick = async (notification: Notification, close: () => void) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            if (notification.link.startsWith('tab:')) {
                const tab = notification.link.split(':')[1];
                localStorage.setItem('dashboard_active_tab', tab);
                if (window.location.pathname === '/dashboard') {
                    window.location.reload(); // Quick explicit reload to enforce state if already on dashed
                } else {
                    window.location.href = '/dashboard';
                }
            } else {
                navigate(notification.link);
            }
        }
        close();
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteNotification(id);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <Check className="w-5 h-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'action_required': return <Bell className="w-5 h-5 text-blue-500" />;
            default: return <Info className="w-5 h-5 text-slate-500" />;
        }
    };

    return (
        <Popover className="relative">
            {({ open, close }) => (
                <>
                    <Popover.Button className={`relative p-2 rounded-full transition-colors ${open ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-950" />
                        )}
                    </Popover.Button>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <Popover.Panel className="fixed inset-0 z-[100] w-screen h-[100dvh] bg-white dark:bg-slate-900 md:absolute md:inset-auto md:right-0 md:mt-2 md:w-96 md:h-auto md:rounded-xl md:shadow-lg md:ring-1 md:ring-black/5 md:focus:outline-none md:border md:border-slate-100 md:dark:border-slate-800 flex flex-col">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 md:bg-slate-50 md:dark:bg-slate-800/50 md:rounded-t-xl shrink-0">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => close()}
                                        className="md:hidden p-2 -ml-2 mr-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg md:text-base">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                                            {unreadCount} New
                                        </span>
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={() => clearAllNotifications()}
                                        className="text-sm md:text-xs text-slate-500 hover:text-red-500 transition-colors"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto md:max-h-[60vh] p-0 md:p-0">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-500 dark:text-slate-400">
                                        <Bell className="w-12 h-12 mb-4 opacity-20" />
                                        <p className="text-base font-medium">No notifications yet</p>
                                        <p className="text-sm mt-1 opacity-70">We'll let you know when something arrives</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                onClick={() => handleNotificationClick(notification, close)}
                                                className={`group p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex gap-4 md:gap-3 ${!notification.is_read ? 'bg-slate-50/80 dark:bg-slate-800/40' : ''}`}
                                            >
                                                <div className={`mt-1 flex-shrink-0 w-10 h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center ${notification.type === 'success' ? 'bg-green-100 dark:bg-green-900/20' :
                                                    notification.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/20' :
                                                        notification.type === 'error' ? 'bg-red-100 dark:bg-red-900/20' :
                                                            notification.type === 'action_required' ? 'bg-blue-100 dark:bg-blue-900/20' :
                                                                'bg-slate-100 dark:bg-slate-800'
                                                    }`}>
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className={`text-base md:text-sm font-medium ${!notification.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="text-xs md:text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                                            {new Date(notification.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm md:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 md:line-clamp-2 leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
                                                    {!notification.is_read && (
                                                        <div className="w-2.5 h-2.5 md:w-2 md:h-2 rounded-full bg-red-500 flex-shrink-0 mb-auto" />
                                                    )}
                                                    <button
                                                        onClick={(e) => handleDelete(notification.id, e)}
                                                        className="md:opacity-0 md:group-hover:opacity-100 p-2 md:p-1 text-slate-400 hover:text-red-500 transition-all rounded active:bg-slate-100 dark:active:bg-slate-800"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Popover.Panel>
                    </Transition>
                </>
            )}
        </Popover>
    );
};
