
import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle, X, Calendar, Clock } from 'lucide-react';
import { Booking } from '../types';

interface CancelBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (bookingId: string, reason: string) => Promise<void>;
    booking: Booking | null;
}

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    booking
}) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!booking) return null;

    // calculate 24h condition
    const pickupDateTime = new Date(`${booking.pickupDate}T${booking.pickupTime}`);
    const now = new Date();
    const diffInHours = (pickupDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const canCancel = diffInHours >= 24;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canCancel) return;

        try {
            setIsSubmitting(true);
            await onConfirm(booking.id, reason);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-left align-middle shadow-xl transition-all border border-slate-100 dark:border-slate-800">

                                {/* Header */}
                                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                        Cancel Trip
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6">
                                    {/* Trip Info */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-md bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                                <img src={booking.assetImage} alt={booking.assetTitle} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-slate-900 dark:text-white">{booking.assetTitle}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{booking.bookingCode || booking.id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {booking.pickupDate}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {booking.pickupTime}
                                            </div>
                                        </div>
                                    </div>

                                    {canCancel ? (
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <p className="text-slate-600 dark:text-slate-300 text-sm">
                                                Are you sure you want to cancel this trip? This action cannot be undone and the fleet owner will be notified.
                                            </p>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                                    Reason for cancellation (optional)
                                                </label>
                                                <textarea
                                                    className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                                                    rows={3}
                                                    placeholder="Something came up..."
                                                    value={reason} // Added missing state
                                                    onChange={(e) => setReason(e.target.value)}
                                                />
                                            </div>

                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={onClose}
                                                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-colors"
                                                >
                                                    Keep Trip
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="text-center py-2">
                                            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-4 rounded-lg text-sm mb-6">
                                                <p className="font-semibold mb-1">Cancellation Unavailable</p>
                                                <p>Trips can only be cancelled at least 24 hours before the scheduled pickup time.</p>
                                            </div>
                                            <button
                                                onClick={onClose}
                                                className="w-full px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
