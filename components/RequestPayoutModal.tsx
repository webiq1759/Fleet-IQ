import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, CreditCard, ChevronDown, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../supabaseClient';
import { usePreferences } from '../contexts/PreferencesContext';

interface RequestPayoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    walletId: string;
    availableBalance: number;
    walletCurrency: string;
    onSuccess: () => void;
}

export const RequestPayoutModal: React.FC<RequestPayoutModalProps> = ({ isOpen, onClose, walletId, availableBalance, walletCurrency, onSuccess }) => {
    const { formatPrice, currency } = usePreferences();
    const [amount, setAmount] = useState<string>('');
    const [banks, setBanks] = useState<{ name: string, code: string }[]>([]);
    const [selectedBankCode, setSelectedBankCode] = useState<string>('');
    const [bankSearchText, setBankSearchText] = useState<string>('');
    const [accountNumber, setAccountNumber] = useState<string>('');
    const [accountName, setAccountName] = useState<string>('');
    const [isFetchingBanks, setIsFetchingBanks] = useState(false);
    const [isFetchingName, setIsFetchingName] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // withdrawal PIN states
    const [securityStatus, setSecurityStatus] = useState<{ isSetup: boolean, isLocked: boolean, attemptsLeft: number } | null>(null);
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [isSettingUpPin, setIsSettingUpPin] = useState(false);

    useEffect(() => {
        if (isOpen) {
            checkSecurityStatus();
            fetchBanks();
        } else {
            // Reset when closing
            setSuccess(false);
            setError(null);
            setAmount('');
            setSelectedBankCode('');
            setBankSearchText('');
            setAccountNumber('');
            setAccountName('');
            setPin('');
            setConfirmPin('');
            setSecurityStatus(null);
        }
    }, [isOpen]);

    const checkSecurityStatus = async () => {
        const { data, error } = await supabase.rpc('get_withdrawal_security_status');
        if (!error && data) {
            setSecurityStatus(data);
        } else {
            console.error("Error checking security status", error);
        }
    };

    const handleSetupPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (pin.length !== 4 || confirmPin.length !== 4) {
            setError("PIN must be exactly 4 digits.");
            return;
        }
        if (pin !== confirmPin) {
            setError("PINs do not match.");
            return;
        }
        setIsSettingUpPin(true);
        try {
            const { error: setupError } = await supabase.rpc('setup_withdrawal_pin', { p_pin: pin });
            if (setupError) throw setupError;
            checkSecurityStatus();
            setPin('');
            setError(null);
        } catch (err: any) {
            setError(err.message || "Failed to set up PIN");
        } finally {
            setIsSettingUpPin(false);
        }
    };

    const fetchBanks = async () => {
        setIsFetchingBanks(true);
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) console.error("Session Error:", sessionError);

            console.log("Session Token Present?", !!session?.access_token);

            if (!session?.access_token) {
                console.error("CRITICAL: No active user session token found. Edge Function will reject.");
            }

            console.log("Fetching banks from Edge Function...");

            // Note: supabase.functions.invoke automatically attaches the JWT if session exists.
            const { data, error } = await supabase.functions.invoke('nomba-lookup', {
                body: { action: 'GET_BANKS' }
            });

            console.log("Bank Data:", data);

            if (error) {
                console.error("Supabase Invoke Error:", error);
                throw error;
            }
            const banksList = data?.data?.results || data?.data || data?.results;

            if (Array.isArray(banksList)) {
                console.log("Found Banks array:", banksList.length);
                const validBanks = banksList.filter(b => b && b.name && b.code);
                const sortedBanks = validBanks.sort((a: any, b: any) =>
                    a.name.localeCompare(b.name)
                );
                setBanks(sortedBanks);
            } else {
                console.warn("Could not find an array in the Nomba payload:", JSON.stringify(data));
                setError("Failed to parse the bank list from the server.");
            }
        } catch (error: any) {
            console.error('Failed to fetch banks', error);
            setError(error?.message || "Server Error: Unable to fetch Nigerian bank list.");
        } finally {
            setIsFetchingBanks(false);
        }
    };

    useEffect(() => {
        if (selectedBankCode && accountNumber.length === 10) {
            verifyAccount();
        } else {
            setAccountName(''); // Reset if invalid
        }
    }, [selectedBankCode, accountNumber]);

    const verifyAccount = async () => {
        setIsFetchingName(true);
        setAccountName('');
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            const { data, error } = await supabase.functions.invoke('nomba-lookup', {
                body: {
                    action: 'VERIFY_ACCOUNT',
                    payload: {
                        accountNumber,
                        bankCode: selectedBankCode
                    }
                }
            });

            console.log("Verify Response:", data);

            if (error) throw error;

            const resolvedName = data?.data?.accountName || data?.data?.account_name || data?.accountName || data?.data?.name;
            if (resolvedName) {
                setAccountName(resolvedName);
            } else {
                setError("Could not verify this account number.");
            }
        } catch (error: any) {
            console.error('Failed to fetch real name', error);
            setError("Error verifying account number with bank.");
        } finally {
            setIsFetchingName(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const inputAmount = parseFloat(amount);
        if (isNaN(inputAmount) || inputAmount <= 0) {
            setError('Please enter a valid amount greater than 0');
            setIsSubmitting(false);
            return;
        }

        if (currency.code === 'NGN' && inputAmount < 1000) {
            setError('Minimum withdrawal amount is ₦1,000');
            setIsSubmitting(false);
            return;
        }

        // We must convert the requested amount back to USD before comparing or sending to the RPC, 
        // UNLESS the user is strictly NGN natively, in which case we supply the raw amount precisely to completely bypass Live Exchange inflation loops.
        const withdrawalAmountInUSD = walletCurrency === 'NGN' ? inputAmount : inputAmount / currency.rate;

        // Add a tiny buffer (0.01) to prevent floating point math from causing phantom exceed errors.
        if (withdrawalAmountInUSD > availableBalance + 0.01) {
            setError('Amount exceeds your available balance');
            setIsSubmitting(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Find the selected bank name for the ledger
            const bankNameStr = banks.find(b => b.code === selectedBankCode)?.name || 'Unknown Bank';

            const { data, error: rpcError } = await supabase.rpc('request_payout_secured', {
                p_wallet_id: walletId,
                p_amount: withdrawalAmountInUSD,
                p_pin: pin,
                p_bank_details: {
                    bank_name: bankNameStr,
                    bank_code: selectedBankCode, // Add strict Nomba API bank_code mapping
                    account_number: accountNumber,
                    account_name: accountName,
                    requested_amount: inputAmount,
                    requested_local_amount: inputAmount,
                    currency: currency.code,
                    email: user?.email // Securely capture exact Auth Email for the Admin Dashboard to reply to
                }
            });

            if (rpcError) {
                checkSecurityStatus();
                throw rpcError;
            }

            if (data && data.success === false) {
                checkSecurityStatus();
                throw new Error(data.error || 'Invalid withdrawal PIN.');
            }

            // Send Confirmation Email
            if (user?.email) {
                supabase.functions.invoke('send-email', {
                    body: {
                        to: user.email,
                        template: 'payout_requested',
                        data: {
                            ownerName: accountName,
                            currency: currency.code,
                            amount: inputAmount,
                            bankName: bankNameStr,
                            accountNumber: accountNumber
                        }
                    }
                }).catch(e => console.error("Email send failed:", e));

                // Send Notification Email to Finance Admin
                supabase.functions.invoke('send-email', {
                    body: {
                        to: 'account@fleetiq.cc',
                        template: 'admin_payout_requested',
                        data: {
                            ownerName: accountName,
                            currency: currency.code,
                            amount: inputAmount,
                            bankName: bankNameStr,
                            accountNumber: accountNumber
                        }
                    }
                }).catch(e => console.error("Admin Email send failed:", e));
            }

            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
                setSuccess(false);
                setAccountName('');
                setSelectedBankCode('');
                setBankSearchText('');
                setAccountNumber('');
                setPin('');
            }, 2000);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to submit payout request');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!document.body) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request Payout</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {securityStatus === null ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">Loading security settings...</p>
                        </div>
                    ) : securityStatus.isLocked ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <X className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Withdrawals Locked</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-[320px] mx-auto mb-6">
                                For your protection, payouts have been disabled due to too many failed PIN attempts. Please <a href="#" onClick={(e) => { e.preventDefault(); localStorage.setItem('dashboard_active_tab', 'support'); window.location.href = '/dashboard'; }} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">contact support</a>.
                            </p>
                            <Button type="button" onClick={onClose} fullWidth>Close Window</Button>
                        </div>
                    ) : securityStatus.isSetup === false ? (
                        <form onSubmit={handleSetupPin} className="space-y-5">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Setup Withdrawal PIN</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Create a 4-digit secure PIN to authorize all future platform withdrawals.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    Enter 4-Digit PIN
                                </label>
                                <input
                                    type="password"
                                    required
                                    maxLength={4}
                                    pattern="\d{4}"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white text-center text-lg tracking-[0.5em] font-mono"
                                    placeholder="••••"
                                    disabled={isSettingUpPin}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    Confirm PIN
                                </label>
                                <input
                                    type="password"
                                    required
                                    maxLength={4}
                                    pattern="\d{4}"
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white text-center text-lg tracking-[0.5em] font-mono"
                                    placeholder="••••"
                                    disabled={isSettingUpPin}
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-start gap-2">
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="pt-2 flex gap-3">
                                <Button type="submit" fullWidth disabled={isSettingUpPin || pin.length !== 4 || confirmPin.length !== 4}>
                                    {isSettingUpPin ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save & Continue'}
                                </Button>
                            </div>
                        </form>
                    ) : success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Request Submitted!</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-[250px] mx-auto">
                                Your payout request is being processed and will be approved shortly.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Amount Field */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    Amount to Withdraw
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-500 font-medium">{currency.symbol}</span>
                                    </div>
                                    <input
                                        type="number"
                                        required
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-shadow"
                                        placeholder="0.00"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="mt-2 flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Available: <span className="font-semibold text-slate-900 dark:text-white">
                                        {walletCurrency === 'NGN' ? '₦ ' + availableBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : formatPrice(availableBalance)}
                                    </span></span>
                                    <button type="button" onClick={() => setAmount(walletCurrency === 'NGN' ? availableBalance.toString() : (availableBalance * currency.rate).toFixed(2))} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium tracking-wide uppercase">
                                        Max
                                    </button>
                                </div>
                                {currency.code === 'NGN' && parseFloat(amount) > 0 && (
                                    <div className="mt-4 p-3 bg-slate-100/50 dark:bg-slate-800/80 rounded-lg text-sm space-y-2 border border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                            <span>Withdrawal Amount</span>
                                            <span>₦{parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                            <span>Transfer Fee</span>
                                            <span className="text-red-500 dark:text-red-400 font-medium">-₦50</span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-slate-900 dark:text-white font-bold">
                                            <span>Amount Sent to Bank</span>
                                            <span className="text-green-600 dark:text-green-400">
                                                ₦{Math.max(0, parseFloat(amount) - 50).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bank Details */}
                            <div className="pt-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-slate-400" /> Bank Transfer Details
                                </label>

                                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            list="bank-list"
                                            required
                                            value={bankSearchText}
                                            placeholder="Search for your bank..."
                                            onChange={(e) => {
                                                setBankSearchText(e.target.value);
                                                const selected = banks.find(b => b.name === e.target.value);
                                                if (selected) {
                                                    setSelectedBankCode(selected.code);
                                                } else {
                                                    setSelectedBankCode('');
                                                }
                                            }}
                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                                            disabled={isSubmitting || isFetchingBanks}
                                        />
                                        <datalist id="bank-list">
                                            {banks.map((bank) => (
                                                <option key={bank.code} value={bank.name} />
                                            ))}
                                        </datalist>
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                                            {isFetchingBanks ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            required
                                            value={accountNumber}
                                            onChange={(e) => setAccountNumber(e.target.value)}
                                            placeholder="Account Number (10 digits)"
                                            maxLength={10}
                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                                            disabled={isSubmitting || !selectedBankCode}
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            value={accountName}
                                            readOnly
                                            disabled
                                            placeholder={isFetchingName ? "Verifying Account with Bank..." : "Verified Account Name"}
                                            className={`w-full px-3 py-2 text-sm border rounded-md cursor-not-allowed ${accountName ? 'bg-green-50/50 border-green-200 text-green-700 dark:bg-green-900/10 dark:border-green-800/30 dark:text-green-400 font-medium' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                                            title="Payouts must match your verified registered name."
                                        />
                                        {isFetchingName && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                                            </div>
                                        )}
                                        {accountName && !isFetchingName && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Verified Warning */}
                            {accountName && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider font-semibold">
                                    ✓ Nomba Verified
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-start gap-2">
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* PIN Confirmation */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between items-center">
                                    <span>Withdrawal PIN</span>
                                </label>
                                <input
                                    type="password"
                                    required
                                    maxLength={4}
                                    pattern="\d{4}"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white text-center text-lg tracking-[0.5em] font-mono"
                                    placeholder="••••"
                                    disabled={isSubmitting}
                                />
                                <p className="text-xs text-slate-400 mt-1 text-center">
                                    Enter your 4-digit PIN to authorize this payout. {securityStatus?.attemptsLeft < 3 ? <span className="text-red-500">({securityStatus.attemptsLeft} attempts left)</span> : ""}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={isSubmitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" fullWidth disabled={isSubmitting || !amount || parseFloat(amount) <= 0 || !selectedBankCode || !accountNumber || !accountName || pin.length !== 4}>
                                    {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Request'}
                                </Button>
                            </div>

                        </form>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
