
import React, { useState, useEffect, useRef } from 'react';
import {
  Globe, Building2, CreditCard, Code, Bell, Wallet, Gift,
  Copy, RefreshCw, Check, Upload, Shield, Eye, EyeOff, Plus, Loader2, ArrowRight
} from 'lucide-react';
import { Button } from '../../components/Button';
import { NotificationModal } from '../../components/NotificationModal';
import { usePreferences } from '../../contexts/PreferencesContext';
import { CURRENCIES, LANGUAGES } from '../../constants';
import { supabase } from '../../supabaseClient';
import { Wallet as WalletComponent } from './Wallet';
import { Referrals } from './Referrals';
import { countries } from '../../data/countries';

type TabType = 'general' | 'profile' | 'billing' | 'integration' | 'notifications' | 'wallet' | 'referrals';

interface SettingsProps {
  mode?: 'RENTER' | 'LISTER';
}

export const Settings: React.FC<SettingsProps> = ({ mode = 'LISTER' }) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const { currency, language, setCurrency, setLanguage, formatPrice } = usePreferences();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification State
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ isOpen: true, title, message, type });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  // Real User State
  const [userProfile, setUserProfile] = useState({
    id: '',
    type: 'INDIVIDUAL',
    name: '',
    email: '',
    phone: '',
    logo: null as string | null,
    timezone: 'Africa/Lagos',
    taxId: '',
    location: '',
    bio: '',
    rcNumber: '',
    cacCertificateUrl: '',
    webhookUrl: '',
    webhookSecret: '',
    languages: '',
    gender: '', // Added gender field
    work: '',
    country: '',
    state: '',
    apiKey: '',
    solanaWalletAddress: '',
    acceptsSolana: false
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();

        // Prioritize DB profile data, fallback to auth metadata
        // This ensures registration data (in metadata) is shown even if DB trigger missed it
        const profileName = data?.company_name || data?.full_name;
        const metaName = user.user_metadata?.full_name;
        const displayName = profileName || metaName || '';

        const profileAvatar = data?.avatar_url;
        const metaAvatar = user.user_metadata?.avatar_url;
        const displayAvatar = profileAvatar || metaAvatar;

        // Phone is stored in auth metadata or auth phone column
        const metaPhone = user.user_metadata?.phone || user.phone || '';

        setUserProfile({
          id: user.id,
          type: data?.role === 'LISTER' && data?.company_name ? 'COMPANY' : 'INDIVIDUAL',
          name: displayName,
          email: user.email || '',
          phone: metaPhone,
          logo: displayAvatar,
          timezone: 'Africa/Lagos', // Placeholder if not in DB
          taxId: data?.tax_id || '', // Map tax_id from DB
          location: data?.location || '',
          bio: data?.bio || '',
          rcNumber: data?.rc_number || '',
          cacCertificateUrl: data?.cac_certificate_url || '',
          webhookUrl: data?.webhook_url || '',
          webhookSecret: data?.webhook_secret || '',
          languages: data?.languages ? data.languages.join(', ') : '',
          work: data?.work || '',
          country: data?.country || '',
          state: data?.state || '',
          apiKey: data?.api_key || '',
          solanaWalletAddress: data?.solana_wallet_address || '',
          acceptsSolana: data?.accepts_solana || false
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${userProfile.id}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    setIsUploading(true);
    try {
      // Assuming 'media' bucket is public and allows uploads
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('media').getPublicUrl(filePath);

      if (data) {
        setUserProfile(prev => ({ ...prev, logo: data.publicUrl }));
      }
    } catch (error: any) {
      showNotification('Upload Failed', error.message || 'Error uploading image', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCACUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `cac-${userProfile.id}-${Math.random()}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    setIsUploading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('media') // reusing media bucket
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('media').getPublicUrl(filePath);

      if (data) {
        setUserProfile(prev => ({ ...prev, cacCertificateUrl: data.publicUrl }));
        // Suggest immediate save or let user save manually? Let's auto-save for documents usually? 
        // Or just let them click Update Profile. Better to let them click Update Profile for consistency.
      }
    } catch (error: any) {
      showNotification('Upload Failed', error.message || 'Error uploading document', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);

      // 1. Update Auth Metadata (Syncs phone and name to user object)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: userProfile.name,
          phone: userProfile.phone,
          avatar_url: userProfile.logo
        }
      });
      if (authError) throw authError;

      // 2. Update Public Profiles Table
      const updates: any = {
        avatar_url: userProfile.logo,
        email: userProfile.email,
        phone: userProfile.phone,
        location: userProfile.location,
        bio: userProfile.bio,
        tax_id: userProfile.taxId,
        rc_number: userProfile.rcNumber,
        cac_certificate_url: userProfile.cacCertificateUrl,
        webhook_url: userProfile.webhookUrl,
        webhook_secret: userProfile.webhookSecret,
        languages: userProfile.languages.split(',').map(s => s.trim()).filter(Boolean),
        work: userProfile.work,
        country: userProfile.country,
        state: userProfile.state,
        api_key: userProfile.apiKey,
        solana_wallet_address: userProfile.solanaWalletAddress,
        accepts_solana: userProfile.acceptsSolana,
        updated_at: new Date().toISOString()
      };

      if (userProfile.type === 'COMPANY') {
        updates.company_name = userProfile.name;
      } else {
        updates.full_name = userProfile.name;
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', userProfile.id);

      if (error) throw error;
      showNotification('Success', 'Profile updated successfully', 'success');
    } catch (error: any) {
      showNotification('Update Failed', error.message || 'Error updating profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Integration Links
  const publicLink = `https://fleetiq.cc/book/${userProfile.name.toLowerCase().replace(/\s+/g, '-')}`;

  const allTabs = [
    { id: 'general', label: 'General', icon: Globe, roles: ['LISTER', 'RENTER'] },
    { id: 'profile', label: 'Profile', icon: Building2, roles: ['LISTER', 'RENTER'] },
    { id: 'billing', label: 'Subscription', icon: CreditCard, roles: ['LISTER'] },
    { id: 'integration', label: 'Integration', icon: Code, roles: ['LISTER'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['LISTER', 'RENTER'] },
    { id: 'wallet', label: 'Wallet', icon: Wallet, roles: ['LISTER'] },
    { id: 'referrals', label: 'Referrals & Rewards', icon: Gift, roles: ['LISTER', 'RENTER'] },
  ];

  const tabs = allTabs.filter(t => t.roles.includes(mode));

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('Copied', 'Link copied to clipboard!', 'info');
  };

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">General Preferences</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your regional settings and display preferences.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Language</label>
                <select
                  value={language.code}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name} ({lang.region})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Default Currency</label>
                <select
                  value={currency.code}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                >
                  {CURRENCIES.map(curr => (
                    <option key={curr.code} value={curr.code}>{curr.code} - {curr.name} ({curr.symbol})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Timezone</label>
                <select
                  value={userProfile.timezone}
                  onChange={(e) => setUserProfile({ ...userProfile, timezone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="Africa/Lagos">West Africa Time (WAT) - Lagos</option>
                  <option value="Europe/London">Greenwich Mean Time (GMT) - London</option>
                  <option value="America/New_York">Eastern Time (ET) - New York</option>
                  <option value="Asia/Dubai">Gulf Standard Time (GST) - Dubai</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={() => showNotification('Saved', 'Preferences saved successfully', 'success')}>Save Changes</Button>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                {mode === 'RENTER' ? 'Personal Profile' : (userProfile.type === 'COMPANY' ? 'Organization Profile' : 'Individual Profile')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Update your public facing identity and details.</p>
            </div>

            <div className="flex items-center gap-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 relative overflow-hidden group cursor-pointer hover:border-red-500 transition-colors"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                />
                {userProfile.logo ? (
                  <>
                    <img src={userProfile.logo} alt="Logo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1 group-hover:text-red-500 transition-colors" />
                    <span className="text-[10px] text-slate-500 group-hover:text-red-500 transition-colors">Upload Photo</span>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-1">Profile Image</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Recommended dimensions: 400x400px. <br /> Max size: 2MB.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </Button>
                  {userProfile.logo && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => setUserProfile(prev => ({ ...prev, logo: null }))}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {mode === 'RENTER' ? 'Full Name' : (userProfile.type === 'COMPANY' ? 'Organization Name' : 'Full Name')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={userProfile.name}
                    readOnly
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed pr-10"
                    title="Your name cannot be changed."
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Shield className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  value={userProfile.email}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                <input
                  type="tel"
                  value={userProfile.phone}
                  onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                  placeholder="+1234567890"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Country</label>
                  <div className="relative">
                    <select
                      value={userProfile.country}
                      onChange={(e) => setUserProfile({ ...userProfile, country: e.target.value, state: '' })}
                      className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none appearance-none"
                    >
                      <option value="">Select Country</option>
                      {countries.map(c => (
                        <option key={c.code} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">State / Region</label>
                  <div className="relative">
                    <select
                      value={userProfile.state}
                      onChange={(e) => setUserProfile({ ...userProfile, state: e.target.value })}
                      disabled={!userProfile.country}
                      className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select State</option>
                      {userProfile.country && countries.find(c => c.name === userProfile.country)?.states.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Street Address / City</label>
                <input
                  type="text"
                  value={userProfile.location}
                  onChange={(e) => setUserProfile({ ...userProfile, location: e.target.value })}
                  placeholder="e.g. 42 Marina Road, Lagos"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Bio</label>
                <textarea
                  value={userProfile.bio}
                  onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Work / Job Title</label>
                  <input
                    type="text"
                    value={userProfile.work}
                    onChange={(e) => setUserProfile({ ...userProfile, work: e.target.value })}
                    placeholder="e.g. Entrepreneur, Pilot"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Languages (comma separated)</label>
                  <input
                    type="text"
                    value={userProfile.languages}
                    onChange={(e) => setUserProfile({ ...userProfile, languages: e.target.value })}
                    placeholder="e.g. English, French, Spanish"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              {mode === 'LISTER' && userProfile.type === 'COMPANY' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tax ID</label>
                    <input
                      type="text"
                      value={userProfile.taxId}
                      onChange={(e) => setUserProfile({ ...userProfile, taxId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Registration Number (RC)</label>
                    <input
                      type="text"
                      value={userProfile.rcNumber}
                      onChange={(e) => setUserProfile({ ...userProfile, rcNumber: e.target.value })}
                      placeholder="e.g. RC123456"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">CAC Certificate</label>
                    <div className="flex items-center gap-4">
                      {userProfile.cacCertificateUrl ? (
                        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
                          <Shield className="w-4 h-4" />
                          <span className="text-sm font-medium">Uploaded</span>
                          <a href={userProfile.cacCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline ml-2">View</a>
                          <button onClick={() => setUserProfile(p => ({ ...p, cacCertificateUrl: '' }))} className="text-xs text-red-500 hover:underline ml-2">Remove</button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                          <Upload className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Upload Document</span>
                          <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleCACUpload} disabled={isUploading} />
                        </label>
                      )}
                      {isUploading && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
                    </div>
                    <p className="text-xs text-slate-500">Upload your certificate of incorporation (PDF, PNG, JPG).</p>
                  </div>
                </div>
              )}

            </div>

            <div className="pt-4">
              <Button onClick={handleSaveProfile} disabled={isSaving || isUploading}>
                {isSaving ? 'Updating...' : 'Update Profile'}
              </Button>
            </div>
          </div>
        );

      case 'billing':
        if (mode !== 'LISTER') return null;
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Subscription & Billing</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your plan, payment methods, and invoices.</p>
            </div>
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center text-slate-500">
              Billing information will be available after your first transaction.
            </div>
          </div>
        );

      case 'integration':
        if (mode !== 'LISTER') return null;
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Integration & API</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
                Connect FleetIQ to your existing systems. Build custom booking flows, sync inventory, and receive real-time updates using our REST API and Webhooks.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column: Main Configuration */}
              <div className="xl:col-span-2 space-y-8">

                {/* API Access Section */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Code className="w-5 h-5 text-red-600" />
                        API Credentials
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Manage your keys for authenticating API requests.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/developer'}>View API Docs</Button>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Public API Key</label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <div className="w-full px-4 py-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-sm border border-slate-700 font-medium">
                            {userProfile.apiKey ? (
                              <div className="flex items-center justify-between">
                                <span>{userProfile.apiKey}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">No key generated</span>
                            )}
                          </div>
                        </div>
                        {userProfile.apiKey && (
                          <Button variant="secondary" onClick={() => handleCopy(userProfile.apiKey)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="min-w-[100px]"
                          onClick={() => {
                            const newKey = `pk_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
                            setUserProfile(prev => ({ ...prev, apiKey: newKey }));
                            setTimeout(() => handleSaveProfile(), 100);
                          }}
                        >
                          {userProfile.apiKey ? 'Roll Key' : 'Generate'}
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-emerald-500" />
                        Use this key in the <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">Authorization</code> header: <span className="font-mono text-xs">Bearer {userProfile.apiKey ? 'pk_live_...' : 'YOUR_KEY'}</span>
                      </p>
                    </div>



                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Asset Inventory Endpoint</label>
                      <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-slate-300 overflow-x-auto border border-slate-800 relative group">
                        <span className="text-purple-400">GET</span> <span className="text-green-400">https://api.fleetiq.cc/v1/partners/{userProfile.id}/assets</span>
                        <button
                          onClick={() => handleCopy(`https://api.fleetiq.cc/v1/partners/${userProfile.id}/assets`)}
                          className="absolute right-2 top-2 p-2 bg-slate-800 rounded hovered:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Webhooks Section */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      Webhook Events
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Listen for asynchronous events like booking confirmations and payments.</p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Endpoint URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={userProfile.webhookUrl}
                          onChange={(e) => setUserProfile({ ...userProfile, webhookUrl: e.target.value })}
                          placeholder="https://your-api.com/webhooks/fleetiq"
                          className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 font-mono text-sm"
                        />
                        <Button onClick={handleSaveProfile} disabled={isSaving}>Save URL</Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Signing Secret</label>
                        <div className="flex gap-2 items-center">
                          <code className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 text-xs font-mono truncate">
                            {userProfile.webhookSecret || 'No secret generated'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newSecret = `whsec_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
                              setUserProfile(prev => ({ ...prev, webhookSecret: newSecret }));
                              setTimeout(() => handleSaveProfile(), 100);
                            }}
                          >
                            {userProfile.webhookSecret ? 'Refresh' : 'Create'}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 pt-1">
                        <p className="text-xs font-medium text-slate-900 dark:text-white">Supported Events:</p>
                        <div className="flex flex-wrap gap-2">
                          {['booking.created', 'booking.paid', 'booking.completed'].map(evt => (
                            <span key={evt} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-[10px] font-mono border border-blue-100 dark:border-blue-800">
                              {evt}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Widgets & Tools */}
              <div className="space-y-8">
                {/* Public Page Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Building2 className="w-16 h-16 text-white/5" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 z-10 relative">Hosted Booking Page</h3>
                  <p className="text-slate-300 text-sm mb-6 z-10 relative max-w-[90%]">Your customizable, SEO-optimized page for showcasing assets.</p>

                  <div className="space-y-3 z-10 relative">
                    <button
                      onClick={() => window.open(publicLink, '_blank')}
                      className="w-full py-2.5 bg-white text-slate-900 rounded-lg font-medium text-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                    >
                      Visit Live Page <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCopy(publicLink)}
                      className="w-full py-2.5 bg-slate-700 text-white rounded-lg font-medium text-sm hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                    >
                      Copy URL <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Widget Code Snippet */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      &lt;/&gt;
                    </div>
                    Website Widget
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Embed this iframe on your website to display your booking form.</p>
                  <div className="bg-slate-900 rounded-lg p-3 group relative">
                    <code className="text-xs font-mono text-purple-300 block break-all leading-relaxed">
                      &lt;iframe src="{publicLink}?embed=true" width="100%" height="800" ... &gt;&lt;/iframe&gt;
                    </code>
                    <div className="absolute inset-0 bg-slate-900/0 hover:bg-slate-900/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button size="sm" variant="secondary" onClick={() => handleCopy(`<iframe src="${publicLink}?embed=true" width="100%" height="800" style="border:none; border-radius: 12px;" title="FleetIQ Booking"></iframe>`)}>
                        Copy Snippet
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Help & Support */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">Need Integration Help?</h4>
                  <p className="text-xs text-slate-500 mb-4">Our engineering team can help you set up your custom integration.</p>
                  <div className="space-y-2">
                    <a href="mailto:support@fleetiq.cc" className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div> Email Support
                    </a>
                    <a href="/developer" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> Developer Docs
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Alerts & Notifications</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Control what messages you receive and how.</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { title: mode === 'LISTER' ? 'New Booking Request' : 'Booking Confirmation', desc: mode === 'LISTER' ? 'When a client submits a new booking.' : 'When your booking is confirmed.' },
                { title: 'System Updates', desc: 'Important platform announcements.' }
              ].map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm">{item.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <span className="text-xs text-slate-500 mr-2">Email</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'wallet':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                {mode === 'LISTER' ? 'Wallet & Payouts' : 'Wallet & Payments'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {mode === 'LISTER' ? 'Manage your earnings and withdrawal methods.' : 'Manage payment methods and transaction history.'}
              </p>
            </div>

            {/* Crypto Payments Settings - Only for Listers */}
            {mode === 'LISTER' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-indigo-500" />
                  Crypto Payments
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-slate-900 dark:text-white block">Accept Solana (SOL)</label>
                      <p className="text-xs text-slate-500">Allow renters to pay using Solana. Funds are held in escrow.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userProfile.acceptsSolana}
                        onChange={(e) => setUserProfile({ ...userProfile, acceptsSolana: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {userProfile.acceptsSolana && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Your Solana Wallet Address</label>
                      <input
                        type="text"
                        value={userProfile.solanaWalletAddress}
                        onChange={(e) => setUserProfile({ ...userProfile, solanaWalletAddress: e.target.value })}
                        placeholder="Enter your public key (e.g. E7VZ...)"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                      />
                      <p className="text-xs text-amber-600 mt-2 flex items-start gap-1">
                        <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        Payments go to FleetIQ Escrow first, then released to this wallet upon trip completion.
                      </p>
                    </div>
                  )}
                  {/* Save Button for Wallet Tab */}
                  <div className="pt-2">
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Wallet Settings'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Use the new shared Wallet component */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
              <WalletComponent />
            </div>
          </div>
        );

      case 'referrals':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Referrals />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] animate-in fade-in duration-300 pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Configuration and preferences for your account.</p>
      </div>

      {/* Horizontal Toggle/Tab Navigation */}
      <div className="mb-8 overflow-x-auto no-scrollbar pb-2">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                    ${activeTab === tab.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}
                  `}
              >
                <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-red-500' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div>
        {renderContent()}
      </div>

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
};
