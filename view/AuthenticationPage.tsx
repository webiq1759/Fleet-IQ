import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Button } from '../components/Button';
import { Mail, Lock, User, Phone, ArrowRight, Loader2, CheckCircle, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { countries } from '../data/countries';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

declare global {
    interface Window {
        solana?: any;
    }
}

export const AuthenticationPage = ({ initialView = 'login' }: { initialView?: 'login' | 'signup' }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [view, setView] = useState<'login' | 'signup' | 'forgotPassword'>(initialView);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('');
    const [state, setState] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    // Solana State
    const { publicKey, signMessage, disconnect, connect, wallet } = useWallet();
    const { setVisible } = useWalletModal();
    const [isConnectingWallet, setIsConnectingWallet] = useState(false);
    const [authTriggered, setAuthTriggered] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        setView(initialView);

        // Detect Supabase Confirmation Redirect (type=signup) via hash or query param
        const hash = window.location.hash;

        if (hash.includes('type=recovery')) {
            navigate('/reset-password' + hash);
            return;
        }

        if (hash.includes('type=signup') || searchParams.get('verified') === 'true') {
            setSuccessMessage("Your email has been successfully verified! You can now log in.");
            setView('login');
            // Clean URL so it doesn't show again on refresh
            window.history.replaceState(null, '', window.location.pathname);
        }

        // Determine view from URL query if present (e.g. ?mode=signup)
        const mode = searchParams.get('mode');
        if (mode === 'signup') setView('signup');
        if (mode === 'login') setView('login');
    }, [initialView, searchParams]);

    const handleEmailAuth = async (e: React.FormEvent) => {
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
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            phone: phone,
                            country: country,
                            state: state,
                            location: `${state}, ${country}`,
                            avatar_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(email)}&backgroundColor=ef4444,f97316`
                        }
                    }
                });

                if (signUpError) {
                    if (signUpError.message.toLowerCase().includes('already registered') || signUpError.message.toLowerCase().includes('already exists')) {
                        setSuccessMessage("An account with this email already exists! We've switched you to Sign In.");
                        setView('login');
                        setIsLoading(false);
                        return;
                    }
                    throw signUpError;
                }

                alert('Account created! Please check your email for verification.');
                setView('login');
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (signInError) throw signInError;
                // Force a reload to ensure App.tsx re-mounts and fetches fresh user role/profile data
                window.location.href = '/';
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
                    // Ignore
                }
                throw new Error(errorMessage || 'Failed verify wallet signature');
            }

            if (data?.token) {
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: data.token,
                    refresh_token: data.token
                });
                if (sessionError) throw sessionError;
                window.location.href = '/';
            } else {
                alert('Wallet verified! (Backend integration pending)');
                window.location.href = '/';
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

        // Already connected
        setAuthTriggered(true);
    };

    return (
        <div className="min-h-screen auth-gradient-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-4">
                    <img
                        src="/logo.png"
                        alt="Fleet IQ Logo"
                        className="w-16 h-16 cursor-pointer drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                        onClick={() => navigate('/')}
                    />
                </div>
            </div>

            <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md w-full max-w-[90%] mx-auto">
                <div className="glass-panel py-8 px-6 sm:rounded-3xl sm:px-10 rounded-2xl">
                    <h2 className="mb-2 text-2xl font-bold tracking-tight text-white">
                        {view === 'login' ? 'Sign in' : view === 'signup' ? 'Create an account' : 'Reset password'}
                    </h2>
                    <p className="mb-8 text-sm text-slate-300">
                        {view === 'login' ? "Don't have an account? " : view === 'signup' ? "Already have an account? " : "Enter your email to receive a reset link."}
                        {view !== 'forgotPassword' && (
                            <button onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="font-medium text-red-400 hover:text-red-300">
                                {view === 'login' ? 'Sign up' : 'Sign in'}
                            </button>
                        )}
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg flex items-start gap-2 border border-green-200 dark:border-green-800">
                            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div className="flex-1">{successMessage}</div>
                            <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700">×</button>
                        </div>
                    )}

                    {view === 'forgotPassword' && resetSent ? (
                        <div className="text-center py-6">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Email Sent</h3>
                            <p className="mt-2 text-sm text-slate-500">Check your inbox for password reset instructions.</p>
                            <Button className="mt-6" fullWidth onClick={() => setView('login')}>Return to Login</Button>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleEmailAuth}>
                            {view === 'signup' && (
                                <>
                                    <div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                placeholder="Full Name"
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                className="glass-input appearance-none block w-full px-3 py-3 pl-10 rounded-lg shadow-sm placeholder-slate-400 sm:text-sm transition-colors"
                                            />
                                            <User className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                required
                                                placeholder="Phone Number"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                className="glass-input appearance-none block w-full px-3 py-3 pl-10 rounded-lg shadow-sm placeholder-slate-400 sm:text-sm transition-colors"
                                            />
                                            <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <select
                                                required
                                                value={country}
                                                onChange={e => {
                                                    setCountry(e.target.value);
                                                    setState('');
                                                }}
                                                className="glass-input block w-full px-3 py-3 rounded-lg shadow-sm sm:text-sm transition-colors appearance-none"
                                            >
                                                <option value="" className="bg-slate-900">Select Country</option>
                                                {countries.map(c => <option className="bg-slate-900" key={c.code} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>

                                        {country && (
                                            <div>
                                                <select
                                                    required
                                                    value={state}
                                                    onChange={e => setState(e.target.value)}
                                                    className="glass-input block w-full px-3 py-3 rounded-lg shadow-sm sm:text-sm transition-colors appearance-none"
                                                >
                                                    <option value="" className="bg-slate-900">Select State</option>
                                                    {countries.find(c => c.name === country)?.states.map(s => (
                                                        <option className="bg-slate-900" key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <div>
                                <div className="relative">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        placeholder="Email address"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="glass-input appearance-none block w-full px-3 py-3 pl-10 rounded-lg shadow-sm placeholder-slate-400 sm:text-sm transition-colors"
                                    />
                                    <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                                </div>
                            </div>

                            {view !== 'forgotPassword' && (
                                <div>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            required
                                            placeholder="Password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="glass-input appearance-none block w-full px-3 py-3 pl-10 pr-10 rounded-lg shadow-sm placeholder-slate-400 sm:text-sm transition-colors"
                                        />
                                        <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors">
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {view === 'login' && (
                                <div className="flex items-center justify-end -mt-2">
                                    <button type="button" onClick={() => setView('forgotPassword')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            <div>
                                <Button fullWidth size="lg" type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (view === 'login' ? 'Sign in' : view === 'signup' ? 'Create account' : 'Send Reset Link')}
                                </Button>
                            </div>
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
                                    <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.013-1.133 8.053-3.227 2.107-2.107 2.72-5.187 2.627-7.667H12.48z" />
                                    </svg>
                                    <span className="ml-2">Google</span>
                                </button>

                                <button
                                    onClick={handleSolanaLogin}
                                    disabled={isConnectingWallet}
                                    className="w-full inline-flex justify-center flex-row-reverse items-center py-2.5 px-4 rounded-lg shadow-sm glass-input text-sm font-medium hover:bg-purple-500/20 hover:border-purple-500/50 transition-colors"
                                >
                                    {isConnectingWallet ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            <span>Solana</span>
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
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {view === 'forgotPassword' && !resetSent && (
                        <div className="mt-8 text-center pt-6 border-t border-white/10">
                            <button
                                onClick={() => setView('login')}
                                className="text-sm font-medium text-white hover:text-slate-300 transition-colors flex items-center justify-center mx-auto"
                                type="button"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Sign In
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
