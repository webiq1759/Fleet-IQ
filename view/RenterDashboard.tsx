import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Map, History, Wallet, LifeBuoy, Settings as SettingsIcon, Menu, X, Loader2, Lock, Home, MessageSquare, Heart as HeartIcon, Search, ChevronRight, User, Gift
} from 'lucide-react';
import { Trips } from './renter/Trips';
import { RenterCalendar } from './renter/RenterCalendar';
import { Support } from './dashboard/Support';
import { Settings } from './dashboard/Settings';
import { SavedAssetsModal } from '../components/SavedAssetsModal';
import { AccountMenuModal } from '../components/AccountMenuModal';
import { supabase } from '../supabaseClient';
import { Button } from '../components/Button';
import { Messages } from './dashboard/Messages';

const MENU_ITEMS = [
  { label: 'Bookings', icon: History, subItems: [{ label: 'List View', path: '/account/trips' }, { label: 'Calendar View', path: '/account/calendar' }] },
  { label: 'Messages', icon: MessageSquare, path: '/account/messages' },
  { label: 'Support', icon: LifeBuoy, path: '/account/support' },
  { label: 'Account', icon: User, path: '/account/settings' },
];

export const RenterDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ Bookings: false });
  const navigate = useNavigate();
  const location = useLocation();

  const activePath = location.pathname;

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasAccess(!!session);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasAccess(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (hasAccess === null) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Login Required</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
          Please log in to your account to view your trips, support tickets, and settings.
        </p>
        <Button onClick={() => window.location.href = '/'}>
          Go to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200 pb-20 lg:pb-0">

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Matches Dashboard.tsx style */}
      <aside className={`
        fixed top-16 bottom-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-transform duration-300 transform flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:block
      `}>
        <div className="flex flex-col h-full overflow-y-auto py-6 px-4">
          <div className="space-y-1 flex-1">
            {MENU_ITEMS.map((item) => (
              <div key={item.label}>
                <button
                  onClick={() => {
                    if (item.subItems) {
                      setExpandedMenus(prev => ({ ...prev, [item.label]: !prev[item.label] }));
                    } else if (item.path) {
                      navigate(item.path);
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors relative ${!item.subItems && activePath.startsWith(item.path || '')
                    ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${!item.subItems && activePath.startsWith(item.path || '') ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                  {item.label}
                  {item.subItems && (
                    <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${expandedMenus[item.label] ? 'rotate-90' : ''}`} />
                  )}
                </button>
                {item.subItems && expandedMenus[item.label] && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems.map(subItem => (
                      <button
                        key={subItem.path}
                        onClick={() => { navigate(subItem.path); setIsSidebarOpen(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm rounded-lg transition-colors ${activePath === subItem.path ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/10 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'}`}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Referral Promotional Banner (Inside Menu List, pinned to bottom) */}
          <div className="mt-auto pt-6 px-1">
            <div
              className="bg-gradient-to-br from-red-600 to-orange-500 rounded-xl p-3 text-white relative overflow-hidden group cursor-pointer shadow-md shadow-red-500/20"
              onClick={() => {
                navigate('/account/settings');
                setIsSidebarOpen(false);
              }}
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl transform -translate-x-1/2 translate-y-1/2"></div>

              {/* Reduced height content (horizontal layout) */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs leading-none text-white mb-0.5">Refer a friend</h4>
                    <p className="text-[10px] text-white/90 leading-none">Earn credits for invites.</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>

        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className={`${activePath.includes('messages') ? 'p-0 lg:p-8' : 'p-6 pb-24 lg:p-8 lg:pb-8'}`}>

          <Routes>
            <Route path="trips" element={<Trips />} />
            <Route path="calendar" element={<RenterCalendar />} />
            <Route path="messages" element={<Messages />} />
            <Route path="support" element={<Support />} />
            <Route path="settings" element={<Settings mode="RENTER" />} />
            <Route path="*" element={<Navigate to="trips" replace />} />
          </Routes>
        </div>
      </main>
      <SavedAssetsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
      />

      <AccountMenuModal
        isOpen={isAccountMenuOpen}
        onClose={() => setIsAccountMenuOpen(false)}
        activeTab={activePath.split('/').pop() || 'trips'}
        onNavigate={(tabId) => navigate(`/account/${tabId}`)}
        onSwitchMode={() => navigate('/dashboard')}
        mode="RENTER"
      />

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 lg:hidden px-6 py-3 safe-bottom">
        <div className="flex items-center justify-between">
          {/* Browse (Marketplace) */}
          <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 transition-colors">
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium">Browse</span>
          </button>

          {/* Messages (Now Functional) */}
          <button onClick={() => navigate('/account/messages')} className={`flex flex-col items-center gap-1 transition-colors ${activePath.includes('messages') ? 'text-red-600 dark:text-red-500' : 'text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500'}`}>
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium">Messages</span>
          </button>

          {/* Saved */}
          <button onClick={() => setIsSavedModalOpen(true)} className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 transition-colors">
            <HeartIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">Saved</span>
          </button>

          {/* Bookings (Trips) */}
          <button onClick={() => navigate('/account/trips')} className={`flex flex-col items-center gap-1 transition-colors ${activePath.includes('trips') ? 'text-red-600 dark:text-red-500' : 'text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500'}`}>
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium">Bookings</span>
          </button>

          {/* Account (Opens Sidebar) */}
          <button onClick={() => setIsAccountMenuOpen(true)} className={`flex flex-col items-center gap-1 transition-colors ${isAccountMenuOpen ? 'text-red-600 dark:text-red-500' : 'text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500'}`}>
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
