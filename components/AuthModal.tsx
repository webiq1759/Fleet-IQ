
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User, ArrowRight, Loader2, Phone, MapPin, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from './Button';

import { supabase } from '../supabaseClient';
import { countries } from '../data/countries';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'signup';
  onLogin: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'login', onLogin }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgotPassword'>(initialView);
  const [isLoading, setIsLoading] = useState(false);
  const { publicKey, signMessage, disconnect, connect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [authTriggered, setAuthTriggered] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState('');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setIsLoading(false);
      setError(null);
      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
      setLocation('');
      setCountry('');
      setState('');
      setShowPassword(false);
      setResetSent(false);
    }
  }, [isOpen, initialView]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (view === 'forgotPassword') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
        });

        if (resetError) throw resetError;
        setResetSent(true);

      } else if (view === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              country: country,
              state: state,
              location: `${state}, ${country}`, // Fallback for views that use single location string
              avatar_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(email)}&backgroundColor=ef4444,f97316`
            }
          }
        });

        if (signUpError) {
          if (signUpError.message.toLowerCase().includes('already registered') || signUpError.message.toLowerCase().includes('already exists')) {
            setError("An account with this email already exists! We've switched you to Sign In.");
            setView('login');
            setIsLoading(false);
            return;
          }
          throw signUpError;
        }

        // Apply referral code if provided
        if (referralCode && referralCode.trim() !== '' && data?.user?.id) {
          try {
            await supabase.rpc('apply_referral_code', {
              p_code: referralCode,
              p_new_user_id: data.user.id
            });
          } catch (e) {
            console.error('Failed to apply referral code', e);
          }
        }

        // Auto sign in or show message
        alert('Account created! Please check your email for verification if enabled, or sign in.');

        setView('login');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;

        onLogin();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    // If wallet is connected, but we haven't authenticated with backend yet
    if (publicKey && signMessage && authTriggered && !isConnectingWallet) {
      executeSolanaAuth();
    }
  }, [publicKey, signMessage, authTriggered]);

  // Automatically trigger connect when a wallet adapter is selected in the modal
  useEffect(() => {
    if (wallet && authTriggered && !publicKey) {
      connect().catch(err => {
        console.error("Wallet connect error:", err);
        setIsConnectingWallet(false);
        setAuthTriggered(false);
      });
    }
  }, [wallet, authTriggered, publicKey, connect]);

  const executeSolanaAuth = async () => {
    if (!publicKey || !signMessage) return;

    setIsConnectingWallet(true);
    setError(null);
    try {
      const address = publicKey.toString();
      const message = `Sign this message to authenticate with Fleet IQ.\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      const encodedMessage = new TextEncoder().encode(message);

      // 1. Sign Message
      const signedMessage = await signMessage(encodedMessage);

      // 2. Verify Signature via Edge Function
      const { data, error: funcError } = await supabase.functions.invoke('verify-solana-wallet', {
        body: {
          address: address,
          message: message,
          signature: Array.from(signedMessage),
        }
      });

      if (funcError) {
        console.error('Edge Function Error:', funcError);
        let errorMessage = funcError.message;
        try {
          const errorContext = await funcError.context?.json();
          if (errorContext && errorContext.error) {
            errorMessage = errorContext.error;
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
        throw new Error(errorMessage || 'Failed verify wallet signature');
      }

      if (data?.token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.token,
          refresh_token: data.token
        });
        if (sessionError) throw sessionError;

        onLogin();
        onClose();
      } else {
        alert('Wallet verified! (Backend integration pending)');
        onLogin();
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Wallet connection failed');
      await disconnect();
      setAuthTriggered(false);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleSolanaLogin = async () => {
    setError(null);
    if (!publicKey) {
      setAuthTriggered(true);
      setVisible(true);
      return;
    }

    setAuthTriggered(true);
  };

  const getHeaderText = () => {
    if (view === 'forgotPassword') return 'Reset Password';
    return view === 'login' ? 'Welcome back' : 'Create Renter Profile';
  };

  const getSubHeaderText = () => {
    if (view === 'forgotPassword') return 'Enter your email to receive reset instructions.';
    return view === 'login'
      ? 'Enter your credentials to access your account.'
      : 'Join Fleet IQ to start your premium journey.';
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-panel rounded-[2rem] shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-colors border border-white/10">
        {/* Header Image/Gradient */}
        <div className="h-32 shrink-0 flex items-center justify-center relative border-b border-white/5 bg-slate-900/40">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors focus:outline-none z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <img
              src="/logo.png"
              alt="Fleet IQ Logo"
              className="w-16 h-16 mx-auto mb-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            />
            <h2 className="text-white font-bold text-xl">Fleet IQ</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-bold text-white">
              {getHeaderText()}
            </h3>
            <p className="text-slate-300 text-sm mt-2">
              {getSubHeaderText()}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          {view === 'forgotPassword' && resetSent ? (
            <div className="text-center py-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Check your email</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                We've sent password reset instructions to <strong>{email}</strong>.
              </p>
              <Button fullWidth onClick={() => { setView('login'); setResetSent(false); }}>
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {view === 'signup' && (
                <>
                  <div className="space-y-1">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Full Name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="glass-input w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none transition-all placeholder-slate-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="glass-input w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none transition-all placeholder-slate-400"
                      />
                    </div>
                  </div>


                  <div className="grid grid-cols-2 gap-3 space-y-0">
                    <div className="relative">
                      <select
                        required
                        value={country}
                        onChange={(e) => {
                          setCountry(e.target.value);
                          setState('');
                        }}
                        className="glass-input w-full pl-3 pr-4 py-3 rounded-lg focus:outline-none transition-all appearance-none"
                      >
                        <option value="" className="bg-slate-900 text-white">Select Country</option>
                        {countries.map(c => (
                          <option key={c.code} value={c.name} className="bg-slate-900 text-white">{c.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>

                    {country && (
                      <div className="relative">
                        <select
                          required
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="glass-input w-full pl-3 pr-4 py-3 rounded-lg focus:outline-none transition-all appearance-none"
                        >
                          <option value="" className="bg-slate-900 text-white">Select State</option>
                          {countries.find(c => c.name === country)?.states.map(s => (
                            <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Referral Code (Optional)"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        className="glass-input w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none transition-all placeholder-slate-400 font-mono uppercase"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none transition-all placeholder-slate-400"
                  />
                </div>
              </div>

              {view !== 'forgotPassword' && (
                <div className="space-y-1">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input w-full pl-10 pr-10 py-3 rounded-lg focus:outline-none transition-all placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none p-1 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {view === 'login' && (
                <div className="flex justify-end -mt-2">
                  <button
                    type="button"
                    onClick={() => { setView('forgotPassword'); setError(null); }}
                    className="text-sm text-slate-300 hover:text-white font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button fullWidth size="lg" className="mt-6 group" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {view === 'login' ? 'Signing In...' : view === 'forgotPassword' ? 'Sending Link...' : 'Creating Profile...'}
                  </>
                ) : (
                  <>
                    {view === 'login' ? 'Sign In' : view === 'forgotPassword' ? 'Send Reset Link' : 'Complete Registration'}
                    {view !== 'forgotPassword' && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                  </>
                )}
              </Button>
            </form>
          )}

          {view !== 'forgotPassword' && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
                  <span className="px-2 bg-slate-900/50 text-slate-400 rounded-full backdrop-blur-md">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-lg shadow-sm glass-input text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.013-1.133 8.053-3.227 2.107-2.107 2.72-5.187 2.627-7.667H12.48z" />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={handleSolanaLogin}
                  disabled={isConnectingWallet}
                  className="w-full inline-flex justify-center flex-row-reverse items-center py-2.5 px-4 rounded-lg shadow-sm glass-input text-sm font-medium hover:bg-purple-500/20 hover:border-purple-500/50 transition-colors"
                >
                  {isConnectingWallet ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Solana'}
                  {!isConnectingWallet && (
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 398 314" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="url(#paint0_linear)" />
                      <path d="M64.6 3.8C67 1.4 70.3 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="url(#paint1_linear)" />
                      <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="url(#paint2_linear)" />
                      <defs>
                        <linearGradient id="paint0_linear" x1="260.7" y1="218" x2="89" y2="352.7" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#00FFA3" />
                          <stop offset="1" stopColor="#DC1FFF" />
                        </linearGradient>
                        <linearGradient id="paint1_linear" x1="260.7" y1="-16.1" x2="89" y2="118.6" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#00FFA3" />
                          <stop offset="1" stopColor="#DC1FFF" />
                        </linearGradient>
                        <linearGradient id="paint2_linear" x1="260.7" y1="101" x2="89" y2="235.6" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#00FFA3" />
                          <stop offset="1" stopColor="#DC1FFF" />
                        </linearGradient>
                      </defs>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center pt-6 border-t border-white/10">
            {view === 'forgotPassword' ? (
              <button
                onClick={() => setView('login')}
                className="text-sm font-medium text-white hover:text-slate-300 transition-colors flex items-center justify-center mx-auto"
                type="button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </button>
            ) : (
              <p className="text-sm text-slate-400">
                {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                  className="font-medium text-white hover:text-slate-300 transition-colors"
                  type="button"
                >
                  {view === 'login' ? 'Sign up' : 'Log in'}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
