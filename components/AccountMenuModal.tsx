import React, { useEffect, useState } from 'react';
import {
    LayoutDashboard, MessageSquare, Car, Users, CalendarClock, Map,
    History, Wallet, BarChart3, Shield, LifeBuoy, Settings as SettingsIcon, X, User, Heart
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface AccountMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (tabId: string) => void;
    onSwitchMode: () => void;
    activeTab: string;
    mode?: 'RENTER' | 'OWNER';
}

const OWNER_MENU_ITEMS = [
    { label: 'Overview', icon: LayoutDashboard, id: 'overview' },
    { label: 'Messages', icon: MessageSquare, id: 'messages' },
    { label: 'Fleet Registry', icon: Car, id: 'registry' },
    { label: 'Crew', icon: Users, id: 'crew' },
    { label: 'Dispatch', icon: CalendarClock, id: 'dispatch' },
    { label: 'Live Tracking', icon: Map, id: 'tracking' },
    { label: 'Bookings', icon: History, id: 'bookings' },
    { label: 'Calendar', icon: CalendarClock, id: 'calendar' },
    { label: 'Finance', icon: Wallet, id: 'finance' },
    { label: 'Reports', icon: BarChart3, id: 'reports' },
    { label: 'Team', icon: Shield, id: 'team' },
    { label: 'Support', icon: LifeBuoy, id: 'support' },
    { label: 'Account', icon: User, id: 'settings' },
];

const RENTER_MENU_ITEMS = [
    { label: 'Bookings', icon: History, id: 'trips' },
    { label: 'Calendar', icon: CalendarClock, id: 'calendar' },
    { label: 'Saved Assets', icon: Heart, id: 'saved' },
    { label: 'Messages', icon: MessageSquare, id: 'messages' },
    { label: 'Support', icon: LifeBuoy, id: 'support' },
    { label: 'Account', icon: User, id: 'settings' },
];

export const AccountMenuModal: React.FC<AccountMenuModalProps> = ({
    isOpen,
    onClose,
    onNavigate,
    onSwitchMode,
    activeTab,
    mode = 'OWNER'
}) => {
    const [isVisible, setIsVisible] = useState(false);

    const items = mode === 'RENTER' ? RENTER_MENU_ITEMS : OWNER_MENU_ITEMS;

    useEffect(() => {
        if (isOpen) {
            // Wait for next frame to trigger animation
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsVisible(true);
                });
            });
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center sm:items-center">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                }`}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Dashboard</h3>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Grid Menu */}
                <div className="p-4 grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onNavigate(item.id);
                                onClose();
                            }}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${activeTab === item.id
                                ? 'bg-red-50 border-red-100 text-red-600 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400'
                                : 'bg-slate-50 border-slate-100 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            <item.icon className={`w-6 h-6 mb-2 ${activeTab === item.id ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`} />
                            <span className="text-xs font-medium text-center">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <button
                        onClick={() => {
                            onSwitchMode();
                            onClose();
                        }}
                        className="w-full py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        {mode === 'RENTER' ? 'Go to Marketplace' : 'Switch to Renter View'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
