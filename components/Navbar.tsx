
import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Bell, User, Search, Globe, Moon, Sun, Monitor, LogIn, UserPlus, CircleHelp, History, Settings, Wallet, MapPin, Loader2, ChevronDown, LogOut, MoreVertical, Heart, MessageSquare, LayoutDashboard } from 'lucide-react';
// HMR Trigger

import { PreferencesModal } from './PreferencesModal';
import { SavedAssetsModal } from './SavedAssetsModal';
import { NotificationCenter } from './NotificationCenter';
import { useTheme } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';


interface NavbarProps {
  mode: 'RENTER' | 'LISTER';
  onSwitchMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ mode, onSwitchMode }) => {
  const { openAuthModal } = useAuthModal();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false); // State for mobile profile dropdown
  const [isSavedAssetsOpen, setIsSavedAssetsOpen] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isLister, setIsLister] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Search State initialized from URL
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('search') || '';
  });
  const [isLocating, setIsLocating] = useState(false);

  const { theme, setTheme } = useTheme();
  const { currency, language } = usePreferences();
  const { unreadCount, clearUnread } = useNotification();

  // Check if we are on an asset details page to hide navbar on mobile
  const isAssetDetails = location.pathname.startsWith('/assets/');

  // Ref for the profile dropdown container to detect clicks outside
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkUser = async (session: any) => {
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        setUserAvatar(currentUser.user_metadata?.avatar_url || null);
        try {
          const { data } = await supabase.from('profiles').select('role, linked_owner_id').eq('id', currentUser.id).single();
          setIsLister(data?.role === 'LISTER' || !!data?.linked_owner_id);
        } catch (e) {
          console.error("Error fetching role", e);
          setIsLister(false);
        }
      } else {
        setUserAvatar(null);
        setIsLister(false);
      }
    };

    // Initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUser(session);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync internal state with URL changes (e.g. back button)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlQuery = params.get('search') || '';
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
  }, [location.search]);

  // Debounced Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Only navigate if there is a query or if we are clearing it while already searching
      const currentParams = new URLSearchParams(location.search);
      const currentSearch = currentParams.get('search') || '';

      if (searchQuery !== currentSearch) {
        if (searchQuery) {
          // If searching, always go to marketplace root with query
          navigate(`/?search=${encodeURIComponent(searchQuery)}`, { replace: true });
        } else if (location.pathname === '/' && currentSearch) {
          // If cleared and on marketplace, remove param
          navigate('/', { replace: true });
        }
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, navigate, location.pathname, location.search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Desktop
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      // Mobile
      if (mobileProfileRef.current && !mobileProfileRef.current.contains(event.target as Node)) {
        setIsMobileProfileOpen(false);
      }
    }

    if (isProfileOpen || isMobileProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen, isMobileProfileOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  // Preferences Modal State
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [preferencesTab, setPreferencesTab] = useState<'language' | 'currency'>('language');

  const openAuth = (view: 'login' | 'signup') => {
    openAuthModal(view);
    setIsProfileOpen(false);
    setIsMobileProfileOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileOpen(false);
    setIsMobileProfileOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const openPreferences = (tab: 'language' | 'currency') => {
    setPreferencesTab(tab);
    setIsPreferencesOpen(true);
    setIsMobileMenuOpen(false); // Close mobile menu if open
  };

  const handleListYourFleet = () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    if (isLister) {
      if (mode === 'RENTER') {
        onSwitchMode();
      }
      setTimeout(() => {
        navigate('/?action=add_fleet');
      }, 50);
    } else {
      navigate('/onboarding');
    }
  };

  const handleSwitchToHosting = async () => {
    if (mode === 'LISTER') {
      onSwitchMode();
      return;
    }

    if (!user) {
      navigate('/onboarding');
      return;
    }

    if (isLister) {
      onSwitchMode();
    } else {
      navigate('/onboarding');
    }
  };

  const handleHelpCenter = () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/help');
  };

  const navigateToRenterPage = (path: string) => {
    setIsProfileOpen(false);
    setIsMobileProfileOpen(false);
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/');
    }
  };

  const handleNearbyClick = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        navigate(`/?nearby=true&lat=${latitude}&lng=${longitude}`);
      },
      (error) => {
        setIsLocating(false);
        console.error(error);
        alert("Unable to retrieve your location. Please check your browser permissions.");
      }
    );
  };

  const ProfileTrigger = ({ isOpen }: { isOpen: boolean }) => (
    <div className="flex items-center gap-2 p-1 pr-2 rounded-full border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
      <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-600">
        {userAvatar ? (
          <img src={userAvatar} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <User className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        )}
      </div>
      <ChevronDown className={`h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
    </div>
  );

  // Reusable Dropdown Content
  const DropdownContent = () => (
    <>
      {user ? (
        <>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {user.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
              {user.email}
            </p>
          </div>

          {mode === 'LISTER' && (
            <div className="py-1">
              <button onClick={() => { navigate('/'); setIsProfileOpen(false); setIsMobileProfileOpen(false); }} className="flex items-center w-full text-left px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <LayoutDashboard className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
                Dashboard
              </button>
            </div>
          )}

          {mode === 'RENTER' && (
            <div className="py-1">
              <button onClick={() => navigateToRenterPage('/account/trips')} className="flex items-center w-full text-left px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <History className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
                Bookings
              </button>
              <button onClick={() => navigateToRenterPage('/account/messages')} className="flex items-center w-full text-left px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <MessageSquare className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
                Messages
              </button>
              <button onClick={() => { setIsSavedAssetsOpen(true); setIsProfileOpen(false); setIsMobileProfileOpen(false); }} className="flex items-center w-full text-left px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Heart className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
                Saved Assets
              </button>
              <button onClick={() => navigateToRenterPage('/account/settings')} className="flex items-center w-full text-left px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <User className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
                Account
              </button>
            </div>
          )}
          <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
        </>
      ) : (
        <div className="py-1">
          <button
            onClick={() => openAuth('signup')}
            className="flex items-center w-full text-left px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
            Sign up
          </button>
          <button
            onClick={() => openAuth('login')}
            className="flex items-center w-full text-left px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <LogIn className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
            Log in
          </button>
          <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
        </div>
      )}

      {/* Theme Toggle in Dropdown */}
      <div className="px-4 py-2">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">Theme</p>
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Sun className="w-3.5 h-3.5 mr-1" /> Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Moon className="w-3.5 h-3.5 mr-1" /> Dark
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Monitor className="w-3.5 h-3.5 mr-1" /> Auto
          </button>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

      <div className="py-1">
        {mode === 'RENTER' ? (
          <button
            onClick={handleListYourFleet}
            className="block w-full text-left px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            List your fleet
          </button>
        ) : (
          <button
            onClick={() => {
              onSwitchMode();
              setIsProfileOpen(false);
              setIsMobileProfileOpen(false);
            }}
            className="block w-full text-left px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Switch to traveling
          </button>
        )}

        <button
          onClick={handleHelpCenter}
          className="flex items-center w-full px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <CircleHelp className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
          Help Center
        </button>

        {user && (
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-800 mt-1"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      <nav className={`sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors duration-200 ${isAssetDetails ? 'hidden md:block' : ''}`}>
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 w-full`}>
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            {/* Logo */}
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => navigate('/')}>
              <img src="/logo.png" alt="FleetIQ" className="w-10 h-10 object-contain" />
              <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Fleet<span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">IQ</span>
              </span>
            </div>
            {/* Desktop Search (Renter Mode only) */}
            {mode === 'RENTER' && (
              <div className="hidden md:flex flex-1 max-w-md mx-8">
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-700 rounded-full leading-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-colors"
                    placeholder="Search jets, yachts, vehicles..."
                  />
                  <button
                    type="button"
                    onClick={handleNearbyClick}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer group"
                    title="Find nearby assets"
                  >
                    {isLocating ? (
                      <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4 text-slate-400 group-hover:text-red-500 transition-colors" />
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-1">
              {/* Only show "Switch to Fleet Owner" if user is a verified lister or already in Lister mode */}
              {((isLister && mode === 'RENTER') || mode === 'LISTER') && (
                <button
                  onClick={handleSwitchToHosting}
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Switch to {mode === 'RENTER' ? 'Fleet Owner' : 'Traveling'}
                </button>
              )}

              <button
                onClick={() => openPreferences('language')}
                className="p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors group relative"
              >
                <Globe className="h-4 w-4" />
                <span className="sr-only">{language.name}</span>
              </button>

              <button
                onClick={() => openPreferences('currency')}
                className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors"
              >
                {currency.symbol} {currency.code}
              </button>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

              <NotificationCenter />

              {/* User Profile Dropdown (Desktop) */}
              <div className="relative ml-2" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="focus:outline-none"
                >
                  <ProfileTrigger isOpen={isProfileOpen} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 overflow-hidden ring-1 ring-black ring-opacity-5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <DropdownContent />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu trigger and Profile */}
            <div className="flex md:hidden items-center gap-4">
              <NotificationCenter />
              {/* Mobile Profile Icon (Visible to all) */}
              <div className="relative" ref={mobileProfileRef}>
                <button
                  onClick={() => setIsMobileProfileOpen(!isMobileProfileOpen)}
                  className="focus:outline-none flex items-center"
                >
                  <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-600">
                    {userAvatar ? (
                      <img src={userAvatar} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    )}
                  </div>
                </button>

                {isMobileProfileOpen && (
                  <div className="absolute right-0 top-10 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 overflow-hidden ring-1 ring-black ring-opacity-5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <DropdownContent />
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white rounded-md transition-colors"
                aria-label="Open main menu"
              >
                <MoreVertical className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Slide-Over Drawer - Rendered outside Nav for proper stacking */}
      <div className="md:hidden">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Drawer - Removed shadow-2xl for better UX on left, added border for separation */}
        <div
          className={`fixed top-0 bottom-0 left-0 z-[100] w-[85%] max-w-sm bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col h-[100dvh] ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center" onClick={() => { setIsMobileMenuOpen(false); navigate('/'); }}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white font-bold mr-2">
                F
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Fleet<span className="font-light text-slate-500 dark:text-slate-400">IQ</span>
              </span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 -mr-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto py-6 px-5 space-y-6">
            {/* User Info Section (if logged in) */}
            {user && (
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-lg">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{user.user_metadata?.full_name || 'User'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {((isLister && mode === 'RENTER') || mode === 'LISTER') && (
                <button
                  onClick={() => {
                    handleSwitchToHosting();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-base font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Switch to {mode === 'RENTER' ? 'Fleet Owner' : 'Traveling'}
                </button>
              )}

              {user && mode === 'RENTER' && (
                <>
                  <button
                    onClick={() => navigateToRenterPage('/account/trips')}
                    className="flex items-center w-full px-4 py-3 text-base font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <History className="w-5 h-5 mr-3 text-slate-400" />
                    Bookings
                  </button>
                  <button
                    onClick={() => navigateToRenterPage('/account/messages')}
                    className="flex items-center w-full px-4 py-3 text-base font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <MessageSquare className="w-5 h-5 mr-3 text-slate-400" />
                    Messages
                  </button>
                  <button
                    onClick={() => { setIsSavedAssetsOpen(true); setIsMobileMenuOpen(false); }}
                    className="flex items-center w-full px-4 py-3 text-base font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Heart className="w-5 h-5 mr-3 text-slate-400" />
                    Saved Assets
                  </button>
                  <button
                    onClick={() => navigateToRenterPage('/account/settings')}
                    className="flex items-center w-full px-4 py-3 text-base font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <User className="w-5 h-5 mr-3 text-slate-400" />
                    Account
                  </button>
                </>
              )}

              <button
                onClick={() => openPreferences('language')}
                className="flex items-center w-full px-4 py-3 text-base font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Globe className="w-5 h-5 mr-3 text-slate-400" />
                {language.name}
              </button>

              <button
                onClick={() => openPreferences('currency')}
                className="flex items-center w-full px-4 py-3 text-base font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Wallet className="w-5 h-5 mr-3 text-slate-400" />
                {currency.symbol} {currency.code}
              </button>

              <button
                onClick={handleHelpCenter}
                className="flex items-center w-full px-4 py-3 text-base font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <CircleHelp className="w-5 h-5 mr-3 text-slate-400" />
                Help Center
              </button>
            </div>

            {/* CTA Section */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              {mode === 'RENTER' && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/onboarding');
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-transform"
                >
                  List your fleet
                </button>
              )}

              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center justify-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openAuth('login')}
                    className="py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => openAuth('signup')}
                    className="py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium shadow-md transition-colors"
                  >
                    Sign up
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Footer with Theme Toggle */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">Appearance</p>
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all ${theme === 'light' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <Sun className="w-4 h-4 mr-2" /> Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all ${theme === 'dark' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <Moon className="w-4 h-4 mr-2" /> Dark
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all ${theme === 'system' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Preferences Modal */}
      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        initialTab={preferencesTab}
      />

      <SavedAssetsModal
        isOpen={isSavedAssetsOpen}
        onClose={() => setIsSavedAssetsOpen(false)}
      />
    </>
  );
};
