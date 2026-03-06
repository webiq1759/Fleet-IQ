import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Wallet, CreditCard } from 'lucide-react';
import { Booking } from '../types';
import { Button } from './Button';
import { useExchangeRate } from '../contexts/ExchangeRateContext';
import { initializeNombaPayment } from '../utils/nomba';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import { supabase } from '../supabaseClient';
import { usePreferences } from '../contexts/PreferencesContext';

interface PaymentSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking | null;
}

export const PaymentSelectionModal: React.FC<PaymentSelectionModalProps> = ({ isOpen, onClose, booking }) => {
    const { formatPrice } = usePreferences();
    const { usdToNgnRate } = useExchangeRate();
    const [paymentMethod, setPaymentMethod] = useState<'nomba' | 'solana'>('nomba');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !booking) return null;

    const PLATFORM_WALLET = new PublicKey('E7PZS3FLMpw2gBRxmwdkB32jAw85FHY5PvNTKADy1tqm');

    const handleSolanaPayment = async () => {
        try {
            const provider = (window as any).solana;
            if (!provider || !provider.isPhantom) {
                throw new Error("Phantom Wallet not found. Please install it.");
            }

            await provider.connect();
            const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

            const solPrice = 150; // Mock price
            const amountInSol = booking.totalAmount / solPrice;

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: provider.publicKey,
                    toPubkey: PLATFORM_WALLET,
                    lamports: Math.round(amountInSol * LAMPORTS_PER_SOL)
                })
            );

            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = provider.publicKey;

            const { signature } = await provider.signAndSendTransaction(transaction);
            await connection.confirmTransaction(signature, 'processed');

            return signature;
        } catch (err: any) {
            console.error("Solana Payment Error:", err);
            throw new Error(err.message || "Solana transaction failed.");
        }
    };

    const handlePayment = async () => {
        try {
            setIsProcessing(true);
            setError(null);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error("You must be logged in to pay.");
            }

            if (paymentMethod === 'solana') {
                const signature = await handleSolanaPayment();

                await supabase
                    .from('bookings')
                    .update({ payment_reference: signature, payment_status: 'Paid', status: 'Paid' })
                    .eq('id', booking.id);

                const { error: ledgerError } = await supabase.rpc('process_payment_success', {
                    p_booking_id: booking.id,
                    p_amount: booking.totalAmount,
                    p_currency: 'SOL',
                    p_reference: signature,
                    p_provider: 'Solana'
                });

                if (ledgerError) console.error("Ledger Error:", ledgerError);

                window.location.href = `${window.location.origin}/booking/success?bookingId=${booking.id}`;
            } else {
                const { checkoutUrl, orderReference } = await initializeNombaPayment({
                    amount: booking.totalAmount, // Phase 1 Migration: Trusting native amount without live USD conversion
                    email: user.email || 'guest@fleetiq.com',
                    currency: 'NGN',
                    customerName: user.user_metadata?.full_name || 'Valued Customer',
                    callbackUrl: `${window.location.origin}/booking/success?bookingId=${booking.id}`
                });

                await supabase
                    .from('bookings')
                    .update({ payment_reference: orderReference })
                    .eq('id', booking.id);

                window.location.href = checkoutUrl;
            }
        } catch (err: any) {
            console.error("Payment failed:", err);
            setError(err.message || "Payment initialization failed.");
            setIsProcessing(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => !isProcessing && onClose()} />
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Select a payment method</h3>
                    <button onClick={onClose} disabled={isProcessing} className="p-2 -mr-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 disabled:opacity-50">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Amount Due</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatPrice(booking.totalAmount)}</p>
                    </div>

                    <div className="space-y-3">
                        <label
                            onClick={() => setPaymentMethod('nomba')}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'nomba' ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 ${paymentMethod === 'nomba' ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                    {paymentMethod === 'nomba' && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                                    <span className="font-bold text-slate-900 dark:text-white">Pay with Card (Nomba)</span>
                                </div>
                            </div>
                        </label>

                        {booking.owner?.acceptsSolana && (
                            <label
                                onClick={() => setPaymentMethod('solana')}
                                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'solana' ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 ${paymentMethod === 'solana' ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                        {paymentMethod === 'solana' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Wallet className="w-5 h-5 text-indigo-500" />
                                        <span className="font-bold text-slate-900 dark:text-white">Pay with Solana</span>
                                    </div>
                                </div>
                            </label>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="mt-8">
                        <Button fullWidth onClick={handlePayment} disabled={isProcessing} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900">
                            {isProcessing ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                            ) : (
                                `Pay ${formatPrice(booking.totalAmount)}`
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
