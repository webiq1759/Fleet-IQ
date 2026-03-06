import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePreferences } from '../../contexts/PreferencesContext';
import { Wallet as WalletType, WalletTransaction } from '../../types';
import { ArrowUpRight, ArrowDownRight, DollarSign, Search, Filter, FileText, TrendingUp, TrendingDown, Wallet as WalletIcon, Loader2, Lock, Building2, CheckCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { RequestPayoutModal } from '../../components/RequestPayoutModal';

export const Wallet = () => {
    const { formatPrice, currency } = usePreferences();
    const [wallet, setWallet] = useState<WalletType | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'All' | 'Credits' | 'Debits'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

    // UX States
    const [activeTab, setActiveTab] = useState<'ledger' | 'withdrawals'>('ledger');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 24;

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get Wallet
            let { data: walletData, error: walletError } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (walletError && walletError.code === 'PGRST116') {
                // Wallet doesn't exist, create it via RPC
                const { data: newWalletId, error: createError } = await supabase
                    .rpc('ensure_wallet_exists', {
                        user_uuid: user.id,
                        currency_code: 'NGN' // Default to NGN for now
                    });

                if (newWalletId) {
                    // Fetch again
                    const { data: newWallet } = await supabase
                        .from('wallets')
                        .select('*')
                        .eq('id', newWalletId)
                        .single();
                    walletData = newWallet;
                }
            }

            if (walletData) {
                setWallet({
                    id: walletData.id,
                    userId: walletData.user_id,
                    currency: walletData.currency,
                    balance: walletData.balance,
                    balance_ngn: walletData.balance_ngn,
                    status: walletData.status,
                    createdAt: walletData.created_at
                });

                // 2. Get Transactions
                const { data: trxData, error: trxError } = await supabase
                    .from('wallet_transactions')
                    .select('*')
                    .eq('wallet_id', walletData.id)
                    .order('created_at', { ascending: false });

                if (trxData) {
                    // Pre-calculate mathematically perfect visual balances starting from the current exact Available Balance
                    // This eliminates the 4 NGN float-drift illusion when legacy USD rows are rendered at today's exchange rates.

                    setTransactions(trxData.map((t: any) => ({
                        id: t.id,
                        walletId: t.wallet_id,
                        bookingId: t.booking_id,
                        type: t.type,
                        amount: t.amount,
                        reference: t.reference,
                        balanceAfter: t.balance_after,
                        metadata: t.metadata,
                        createdAt: t.created_at,
                        _raw: t
                    })));
                }

                // 3. Get Payout Requests
                const { data: payoutData, error: payoutError } = await supabase
                    .from('payout_requests')
                    .select('*')
                    .eq('wallet_id', walletData.id)
                    .order('created_at', { ascending: false });

                if (payoutData) {
                    setPayoutRequests(payoutData);
                }
            }

        } catch (error) {
            console.error("Error fetching wallet:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fixed NGN Historic mapping handler to prevent NGN 100 withdrawals showing as 97 NGN due to floating point caching
    const getTrxDisplayAmount = (trx: any) => {
        if (trx.type === 'payout' || trx.type === 'refund') {
            const reqId = trx.reference?.replace('payout_refund_', '')?.replace('payout_', '');
            const linkedRequest = payoutRequests.find(req => req.id === reqId);

            if (linkedRequest?.bank_details?.requested_amount) {
                return (linkedRequest.bank_details.currency === 'NGN' ? '₦ ' : '$') + linkedRequest.bank_details.requested_amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
            }
            if (trx.metadata?.requested_local_amount) {
                return (trx.metadata.currency === 'NGN' ? '₦ ' : '$') + trx.metadata.requested_local_amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
            }
        }
        return wallet?.currency === 'NGN'
            ? '₦ ' + Math.abs(trx.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
            : formatPrice(Math.abs(trx.amount));
    };

    // Calculate a perfect visual ledger array that mathematically enforces `balance - trx.amount = prev_balance` 
    // to shield the user from float drifts across USD-NGN converted databases.
    const enrichedTransactions = React.useMemo(() => {
        if (!wallet) return [];

        const mainCardString = wallet.currency === 'NGN' ? (wallet.balance_ngn || 0).toString() : formatPrice(wallet.balance).replace(/[^0-9.-]+/g, "");
        let currentTarget = parseFloat(mainCardString) || 0;

        // Filter out payout-related commission fees to prevent visual double-counting, 
        // since getTrxDisplayAmount already forces the parent Payout row to render the full sum.
        const mergedTransactions = transactions.filter(trx => !(trx.type === 'commission' && trx.reference?.startsWith('fee_')));

        return mergedTransactions.map((trx) => {
            // First, determine exactly what text we are rendering for this row's magnitude
            const displayStr = getTrxDisplayAmount(trx).replace(/[^0-9.-]+/g, "");
            const visualMagnitude = parseFloat(displayStr) || 0;
            const sign = trx.amount > 0 ? 1 : -1;
            const visualDelta = visualMagnitude * sign;

            const rowBalance = currentTarget;

            // To find the history balance BEFORE this transaction occurred, 
            // we mathematically subtract this transaction's movement from the current target
            currentTarget = currentTarget - visualDelta;

            return {
                ...trx,
                visualBalance: rowBalance
            };
        });
    }, [transactions, wallet, currency, payoutRequests, formatPrice]);

    const filteredTransactions = enrichedTransactions.filter(trx => {
        const isCredit = trx.amount > 0;
        const matchesFilter = filter === 'All' || (filter === 'Credits' && isCredit) || (filter === 'Debits' && !isCredit);
        const matchesSearch = trx.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (trx.reference && trx.reference.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const paginatedPayouts = payoutRequests.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const totalPages = Math.ceil((activeTab === 'ledger' ? filteredTransactions.length : payoutRequests.length) / rowsPerPage);

    // CSV Export Logic
    const exportToCSV = () => {
        let csvContent = "";
        if (activeTab === 'ledger') {
            csvContent += "Type,Reference,Date,Amount,Balance,Status\n";
            filteredTransactions.forEach(trx => {
                const date = new Date(trx.createdAt).toLocaleDateString();
                const amount = trx.amount; // raw amount
                const balance = trx.balanceAfter || '';
                csvContent += `${trx.type},${trx.reference || ''},${date},${amount},${balance},Recorded\n`;
            });
        } else {
            csvContent += "Request ID,Date Submitted,Bank,Account Number,Account Name,Amount,Status\n";
            payoutRequests.forEach(req => {
                const date = new Date(req.created_at).toLocaleDateString();
                const amount = req.bank_details?.requested_amount || formatPrice(req.amount);
                csvContent += `${req.id},${date},${req.bank_details?.bank_name || ''},${req.bank_details?.account_number || ''},${req.bank_details?.account_name || ''},${amount},${req.status}\n`;
            });
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `FLEET_IQ_${activeTab.toUpperCase()}_EXPORT.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Reset page when tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    if (isLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
    }

    if (!wallet) {
        return <div className="p-8 text-center text-slate-500">Initializing Wallet...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300">

            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fetchWalletData()}>Refresh</Button>
                    <Button disabled={wallet.currency === 'NGN' ? (wallet.balance_ngn || 0) <= 0 : wallet.balance <= 0} onClick={() => setIsPayoutModalOpen(true)}>Request Payout</Button>
                </div>
            </div>

            {/* Wallet Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Available Balance */}
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2 opacity-80">
                            <WalletIcon className="w-5 h-5" />
                            <span className="text-sm font-medium uppercase tracking-wider">Available Balance</span>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <h3 className="text-4xl font-bold">
                                {enrichedTransactions.length > 0
                                    ? (wallet.currency === 'NGN' ? (currency.code === 'NGN' ? '₦ ' : '$') + enrichedTransactions[0].visualBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : formatPrice(enrichedTransactions[0].visualBalance))
                                    : (wallet.currency === 'NGN' ? (currency.code === 'NGN' ? '₦ ' : '$') + (wallet.balance_ngn || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : formatPrice(wallet.balance))}
                            </h3>
                            <span className="text-sm bg-slate-800 px-2 py-0.5 rounded text-slate-300">{wallet.currency}</span>
                        </div>
                        {wallet.status === 'frozen' && (
                            <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-900/30 p-2 rounded-lg text-sm">
                                <Lock className="w-4 h-4" /> Wallet Frozen due to active dispute
                            </div>
                        )}
                    </div>
                </div>

                {/* Escrow Balance (Mock for now, or calculate from locked hold transactions) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                            <Lock className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">In Escrow</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {formatPrice(transactions.filter(t => t.type === 'escrow_hold').reduce((sum, t) => sum + Math.abs(t.amount), 0))}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Funds held securely until trip completion</p>
                </div>

                {/* Total Inflow */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Inflow</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {formatPrice(transactions.filter(t => t.amount > 0 && t.type !== 'escrow_release' && t.type !== 'refund').reduce((sum, t) => sum + t.amount, 0))}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Lifetime earnings before deductions</p>
                </div>
            </div>

            {/* Ledger & Withdrawals Section */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mt-8">

                {/* Tabs & Actions Header */}
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start">
                        <button
                            onClick={() => setActiveTab('ledger')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'ledger' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Ledger History
                        </button>
                        <button
                            onClick={() => setActiveTab('withdrawals')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'withdrawals' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Withdrawal Requests
                        </button>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                        {activeTab === 'ledger' && (
                            <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                {['All', 'Credits', 'Debits'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f as any)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === f ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        )}
                        <Button variant="outline" onClick={exportToCSV} className="text-xs py-1.5 px-3 h-auto whitespace-nowrap">
                            <FileText className="w-3.5 h-3.5 mr-1.5" /> Export CSV
                        </Button>
                    </div>
                </div>

                {/* Mobile Filter (Ledger Only) */}
                {activeTab === 'ledger' && (
                    <div className="p-4 md:hidden border-b border-slate-100 dark:border-slate-800">
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-full relative">
                            {['All', 'Credits', 'Debits'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${filter === f ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Data Content */}
                <div className="overflow-x-auto">
                    {activeTab === 'ledger' ? (
                        <>
                            {/* Mobile View: Immersive Stacked Cards for Ledger */}
                            <div className="md:hidden space-y-3 p-2 sm:p-4 bg-slate-50 dark:bg-slate-900/20">
                                {paginatedTransactions.map((trx) => (
                                    <div key={trx.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden relative">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trx.amount > 0 ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                                    {trx.amount > 0 ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900 dark:text-white capitalize">{trx.type.replace('_', ' ')}</div>
                                                    <div className="text-xs text-slate-500 font-medium">{new Date(trx.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className={`font-bold text-lg ${trx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                                                    {trx.amount > 0 ? '+' : '- '}
                                                    {getTrxDisplayAmount(trx)}
                                                </div>
                                                <div className="text-xs text-slate-500 font-medium">
                                                    Balance: {wallet.currency === 'NGN' ? (currency.code === 'NGN' ? '₦ ' : '$') + trx.visualBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : (trx.balanceAfter !== null ? formatPrice(trx.balanceAfter) : '-')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Subtle Reference Footer */}
                                        <div className="pt-3 border-t border-slate-50 dark:border-slate-700/50 flex justify-between items-center text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                                            <span>Ref: {trx.reference || trx.id.slice(0, 8)}</span>
                                            <span className="flex items-center gap-1 text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3 text-green-500" /> Recorded</span>
                                        </div>
                                    </div>
                                ))}
                                {paginatedTransactions.length === 0 && (
                                    <div className="p-8 text-center text-slate-500">No transactions found.</div>
                                )}
                            </div>

                            {/* Desktop View: Ledger Table */}
                            <table className="hidden md:table w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Type / Reference</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-right">Balance</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {paginatedTransactions.map((trx) => (
                                        <tr key={trx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900 dark:text-white capitalize">{trx.type.replace('_', ' ')}</div>
                                                <div className="text-xs text-slate-500 font-mono">{trx.reference || trx.id.slice(0, 8)}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(trx.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold ${trx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {trx.amount > 0 ? '+' : '- '}
                                                {getTrxDisplayAmount(trx)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-500">
                                                {wallet.currency === 'NGN' ? (currency.code === 'NGN' ? '₦ ' : '$') + trx.visualBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : (trx.balanceAfter !== null && trx.balanceAfter !== undefined ? formatPrice(trx.balanceAfter) : '-')}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                                    Recorded
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    ) : (
                        <>
                            {/* Mobile View: Immersive Stacked Cards for Withdrawals */}
                            <div className="md:hidden space-y-3 p-2 sm:p-4 bg-slate-50 dark:bg-slate-900/20">
                                {paginatedPayouts.map((req) => (
                                    <div key={req.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden relative">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900 dark:text-white">Withdrawal</div>
                                                    <div className="text-xs text-slate-500 font-medium">{new Date(req.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-lg text-slate-900 dark:text-white">
                                                    {req.bank_details?.requested_amount ? (req.bank_details.currency === 'NGN' ? '₦ ' : '$') + req.bank_details.requested_amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : formatPrice(req.amount)}
                                                </div>
                                                <div className="mt-1">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${req.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : req.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                        {req.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-xs p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                            <div className="font-medium text-slate-900 dark:text-white">{req.bank_details?.bank_name || 'Bank Transfer'}</div>
                                            <div className="text-slate-500 mt-1 truncate">{req.bank_details?.account_number} • {req.bank_details?.account_name}</div>
                                        </div>

                                        {/* Subtle Reference Footer */}
                                        <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/50 flex justify-between items-center text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                                            <span>Ref: {req.id.slice(0, 12)}</span>
                                        </div>
                                    </div>
                                ))}
                                {paginatedPayouts.length === 0 && (
                                    <div className="p-8 text-center text-slate-500">No withdrawal requests found.</div>
                                )}
                            </div>

                            {/* Desktop View: Withdrawals Table */}
                            <table className="hidden md:table w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Request ID</th>
                                        <th className="px-6 py-4">Date Submitted</th>
                                        <th className="px-6 py-4">Bank Details</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {paginatedPayouts.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500">{req.id.slice(0, 8).toUpperCase()}</td>
                                            <td className="px-6 py-4 text-slate-500">{new Date(req.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-900 dark:text-white">{req.bank_details?.bank_name}</div>
                                                <div className="text-xs text-slate-500">{req.bank_details?.account_number} • {req.bank_details?.account_name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                                                {req.bank_details?.requested_amount
                                                    ? (req.bank_details.currency === 'NGN' ? '₦ ' : '$') + req.bank_details.requested_amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                                                    : formatPrice(req.amount)
                                                }
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${req.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    req.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                            Page <span className="font-medium text-slate-900 dark:text-white">{currentPage}</span> of <span className="font-medium text-slate-900 dark:text-white">{totalPages}</span>
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="text-sm py-1.5 px-3 h-auto"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                className="text-sm py-1.5 px-3 h-auto"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <RequestPayoutModal
                isOpen={isPayoutModalOpen}
                onClose={() => setIsPayoutModalOpen(false)}
                walletId={wallet.id}
                availableBalance={wallet.currency === 'NGN' ? (wallet.balance_ngn || 0) : wallet.balance}
                walletCurrency={wallet.currency}
                onSuccess={() => fetchWalletData()}
            />
        </div>
    );
};
