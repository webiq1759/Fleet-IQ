import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const BookingSuccess = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isConfirming, setIsConfirming] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<'success' | 'error'>('success');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const confirmPayment = async () => {
            const params = new URLSearchParams(window.location.search);
            const bookingId = params.get('bookingId');
            const orderRef = params.get('orderReference') || params.get('ref');

            if (!bookingId || !orderRef) {
                setPaymentStatus('error');
                setErrorMessage('Invalid redirect. Missing booking ID or transaction reference.');
                setIsConfirming(false);
                return;
            }

            try {
                // Fetch booking details
                const { data: booking, error: fetchError } = await supabase
                    .from('bookings')
                    .select('*, assets(*)')
                    .eq('id', bookingId)
                    .single();

                if (fetchError || !booking) {
                    setPaymentStatus('error');
                    setErrorMessage('Booking not found or could not be loaded.');
                    setIsConfirming(false);
                    return;
                }

                if (booking.payment_status !== 'Paid') {
                    // 1. Process ledger & mark as paid
                    const { error: rpcError } = await supabase.rpc('process_payment_success', {
                        p_booking_id: booking.id,
                        p_amount: booking.total_amount,
                        p_currency: 'NGN',
                        p_reference: orderRef,
                        p_provider: 'Nomba'
                    });

                    if (rpcError) {
                        console.error('Ledger RPC Error:', rpcError);
                        // Continue to update booking anyway to avoid locking the user out
                    }

                    const { error: updateError } = await supabase
                        .from('bookings')
                        .update({ payment_status: 'Paid', status: 'Paid', payment_reference: orderRef })
                        .eq('id', booking.id);

                    if (updateError) {
                        throw updateError;
                    }

                    // 2. Fetch Owner profile for email
                    const { data: ownerProfile } = await supabase
                        .from('profiles')
                        .select('email')
                        .eq('id', booking.assets.owner_id)
                        .single();

                    const emailData = {
                        assetName: booking.assets?.title || 'Asset',
                        pickupLocation: booking.pickup_location,
                        pickupDate: booking.start_date,
                        pickupTime: booking.pickup_time,
                        amount: booking.total_amount
                    };

                    // Send to Renter
                    if (user?.email) {
                        // Email
                        await supabase.functions.invoke('send-email', {
                            body: { to: user.email, template: 'payment_confirmed', data: { ...emailData, role: 'renter' } }
                        });
                        // In-App Notification
                        await supabase.from('notifications').insert({
                            user_id: user.id,
                            title: 'Payment Secured in Escrow',
                            message: `Your payment of ₦${Math.round(booking.total_amount * 1650).toLocaleString()} for ${booking.assets?.title} has been received and is secured in an escrow until you confirm the trip is successful.`,
                            type: 'success',
                            read: false,
                            created_at: new Date().toISOString()
                        });
                    }

                    // Send to Owner
                    if (ownerProfile) {
                        // Email
                        if (ownerProfile.email) {
                            await supabase.functions.invoke('send-email', {
                                body: { to: ownerProfile.email, template: 'payment_confirmed', data: { ...emailData, role: 'owner' } }
                            });
                        }
                        // In-App Notification
                        await supabase.from('notifications').insert({
                            user_id: booking.assets.owner_id,
                            title: 'Payment Secured in Escrow',
                            message: `The renter has made a payment of ₦${Math.round(booking.total_amount * 1650).toLocaleString()} for ${booking.assets?.title}. The funds are in a secured escrow. You can now proceed with rendering the requested service.`,
                            type: 'success',
                            read: false,
                            created_at: new Date().toISOString()
                        });
                    }
                }
            } catch (err: any) {
                console.error("Payment confirmation error:", err);
                setPaymentStatus('error');
                setErrorMessage(err.message || 'An unexpected error occurred finalizing your payment.');
            }
            setIsConfirming(false);
        };

        confirmPayment();
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                {isConfirming ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-slate-400 animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Confirming Payment...</h2>
                        <p className="text-slate-500 mt-2 text-sm">Please do not close this window.</p>
                    </div>
                ) : paymentStatus === 'error' ? (
                    <>
                        <div className="bg-red-600 h-32 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <AlertCircle className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div className="p-8 text-center">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Update Failed</h1>
                            <p className="text-red-500 dark:text-red-400 mb-8 font-medium">
                                {errorMessage}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
                                If you have already been charged, please contact support with your transaction reference.
                            </p>
                            <div className="space-y-3">
                                <Button fullWidth onClick={() => navigate('/account/trips')}>
                                    Go to My Trips
                                </Button>
                                <Button fullWidth variant="outline" onClick={() => navigate('/support')}>
                                    Contact Support
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-green-600 h-32 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-bounce">
                                <CheckCircle className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div className="p-8 text-center">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful!</h1>
                            <p className="text-slate-500 dark:text-slate-400 mb-8">
                                Your booking has been confirmed and the funds are securely held in escrow until your trip starts.
                            </p>
                            <div className="space-y-3">
                                <Button fullWidth onClick={() => navigate('/account/trips')}>
                                    View My Bookings
                                </Button>
                                <Button fullWidth variant="outline" onClick={() => navigate('/')}>
                                    Back to Home
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                <div className="bg-slate-50 dark:bg-slate-800 p-4 text-center border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-400">Transaction Ref: {new URLSearchParams(window.location.search).get('ref') || new URLSearchParams(window.location.search).get('orderReference') || 'N/A'}</p>
                </div>
            </div>
        </div>
    );
};
