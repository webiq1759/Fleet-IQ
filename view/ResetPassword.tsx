import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Button } from '../components/Button';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';

export const ResetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Check if we actually have a session with a recovery flow going on
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "PASSWORD_RECOVERY") {
                // The user is ready to reset their password
                console.log("Password recovery session established.");
            }
        });
    }, []);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            setSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 3000);

        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <img
                        src="/logo.png"
                        alt="Fleet IQ Logo"
                        className="w-16 h-16 cursor-pointer drop-shadow-lg"
                        onClick={() => navigate('/')}
                    />
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Set New Password
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                    Please secure your account with a new password.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-slate-100 dark:border-slate-800">
                    {success ? (
                        <div className="text-center py-6">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Password Updated</h3>
                            <p className="mt-2 text-sm text-slate-500">Your password was successfully updated. Redirecting to home...</p>
                            <Button className="mt-6" fullWidth onClick={() => navigate('/')}>Go to Dashboard</Button>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleResetPassword}>
                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                                <div className="mt-1 relative">
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 pl-10 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm dark:bg-slate-800 dark:text-white"
                                    />
                                    <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
                                <div className="mt-1 relative">
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 pl-10 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm dark:bg-slate-800 dark:text-white"
                                    />
                                    <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                                </div>
                            </div>

                            <Button type="submit" fullWidth disabled={isLoading} className="mt-8">
                                {isLoading ? 'Updating...' : 'Update Password'}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
