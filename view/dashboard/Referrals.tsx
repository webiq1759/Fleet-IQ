import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePreferences } from '../../contexts/PreferencesContext';
import { Users, Copy, CheckCircle, Gift, ArrowRight, Loader2, Share2, Award, Ticket, Twitter, Facebook, Send, Wallet } from 'lucide-react';

export const Referrals = () => {
    const { formatPrice } = usePreferences();
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Data States
    const [referralCode, setReferralCode] = useState<string>('');
    const [referralCredits, setReferralCredits] = useState<number>(0);
    const [referredUsers, setReferredUsers] = useState<any[]>([]);
    const [activeUsersCount, setActiveUsersCount] = useState<number>(0);

    useEffect(() => {
        fetchReferralData();
    }, []);

    const fetchReferralData = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Profile Data (Code)
            const { data: profileData } = await supabase
                .from('profiles')
                .select('referral_code, company_name, full_name')
                .eq('id', user.id)
                .single();

            if (profileData) {
                if (profileData.referral_code) {
                    setReferralCode(profileData.referral_code);
                } else {
                    // Generate code on the fly for existing users who missed the DB trigger
                    const generatedCode = await supabase.rpc('generate_referral_code', {
                        p_name: profileData.company_name || profileData.full_name || 'USER',
                        p_id: user.id
                    });

                    if (generatedCode.data) {
                        await supabase.from('profiles').update({ referral_code: generatedCode.data }).eq('id', user.id);
                        setReferralCode(generatedCode.data);
                    }
                }
            }

            // 2. Fetch Wallet Data (Credits)
            const { data: walletData } = await supabase
                .from('wallets')
                .select('referral_credits')
                .eq('user_id', user.id)
                .single();

            if (walletData) {
                setReferralCredits(walletData.referral_credits || 0);
            }

            // 3. Fetch specific referred users
            const { data: refsData } = await supabase
                .from('profiles')
                .select('id, full_name, company_name, created_at, avatar_url')
                .eq('referred_by', user.id)
                .order('created_at', { ascending: false });

            if (refsData) {
                setReferredUsers(refsData);
                // In a real app we would check if they completed a trip, but here we just use the recruited count as 'active' for now
                setActiveUsersCount(refsData.length);
            }

        } catch (error) {
            console.error("Error fetching referral data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareUrl = `https://www.fleetiq.cc/onboarding?ref=${referralCode}`;
    const shareMessage = encodeURIComponent(`Sign up for Fleet IQ using my referral code ${referralCode} and we both earn platform credits!`);

    const handleXShare = () => {
        window.open(`https://twitter.com/intent/tweet?text=${shareMessage}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    };

    const handleWhatsAppShare = () => {
        window.open(`https://api.whatsapp.com/send?text=${shareMessage} ${encodeURIComponent(shareUrl)}`, '_blank');
    };

    const handleFacebookShare = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    };

    if (isLoading) {
        return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12">

            {/* Top Banner (Like Reference Image) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row">

                {/* Left Content */}
                <div className="p-8 md:w-3/5 z-10 flex flex-col justify-center">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Refer a friend and earn credits</h1>
                    <p className="text-slate-600 dark:text-slate-400 max-w-lg mb-8 text-sm">
                        Share your referral code and earn fixed platform credits directly to your wallet when whomever you refer signs up and successfully completes their first Fleet IQ trip.
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Interactive Code Button */}
                        <button
                            onClick={handleCopy}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-bold transition-all active:scale-95 ${copied
                                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                                : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                                }`}
                        >
                            {referralCode || 'PENDING'}
                            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>

                        <button onClick={handleXShare} className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <span>Share to X</span>
                            <Twitter className="w-4 h-4" /> {/* Using Twitter icon as fallback for X */}
                        </button>

                        <button onClick={handleFacebookShare} className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <span>Share to Facebook</span>
                            <Facebook className="w-4 h-4" />
                        </button>

                        <button onClick={handleWhatsAppShare} className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <span>Share to WhatsApp</span>
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Right Decorative Graphic */}
                <div className="hidden md:block absolute right-0 top-0 bottom-0 w-2/5 bg-gradient-to-l from-red-600 to-orange-500 rounded-l-[100px] transform translate-x-8 opacity-90">
                    {/* Decorative Elements */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <Gift className="w-48 h-48 text-white transform rotate-12" />
                    </div>
                    <div className="absolute top-10 right-20 w-16 h-16 bg-white/20 rounded-xl backdrop-blur-md rotate-45 animate-pulse"></div>
                    <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/10 rounded-full backdrop-blur-md"></div>
                </div>

            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Referrals Count */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">No. of referrals</span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                            <Send className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white relative z-10">
                        {referredUsers.length}
                    </div>
                </div>

                {/* Active Users Count */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Active users</span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white relative z-10">
                        {activeUsersCount}
                    </div>
                </div>

                {/* Total Earnings */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Earnings</span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                            <Wallet className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white relative z-10 flex items-baseline gap-2">
                        {formatPrice(referralCredits)}
                        {referralCredits > 0 && <span className="text-xs font-medium text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">Available</span>}
                    </div>
                </div>

            </div>

            {/* Referrals Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider w-5/12">Full Name</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider w-3/12">Registration Date</th>
                                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider w-4/12">Status / Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {referredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                                        You haven't referred anyone yet. Share your code above!
                                    </td>
                                </tr>
                            ) : (
                                referredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="font-medium text-slate-900 dark:text-white text-sm">
                                                {user.company_name || user.full_name || 'New Member'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-300">
                                            {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="py-4 px-6 text-sm">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                                Pending Trip Completion
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};
