import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircle, X, Calendar, Clock } from 'lucide-react';
import { Booking } from '../types';

interface ConfirmTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (booking: Booking) => Promise<void>;
    booking: Booking | null;
    isConfirming: boolean;
}

export const ConfirmTripModal: React.FC<ConfirmTripModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    booking,
    isConfirming
}) => {
    if (!booking) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onConfirm(booking);
            onClose();
        } catch (error) {
            console.error(error);
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

                                {/* Header Pattern */}
                                <div className="h-24 relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600">
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg transform translate-y-8">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                    <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="pt-12 px-6 pb-6 text-center">
                                    <Dialog.Title as="h3" className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                        Confirm Trip Completion
                                    </Dialog.Title>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                                        You are about to confirm that this trip has been completed successfully. This will release the escrow funds to the Fleet Owner.
                                    </p>

                                    {/* Trip Info */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 text-left border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-md bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                                                <img src={booking.assetImage} alt={booking.assetTitle} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{booking.assetTitle}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">{booking.bookingCode || booking.id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                {new Date(booking.pickupDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                {booking.pickupTime}
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmit} className="flex gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isConfirming}
                                            className="flex-1 px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-green-500/20 flex items-center justify-center"
                                        >
                                            {isConfirming ? 'Confirming...' : 'Yes, Complete Trip'}
                                        </button>
                                    </form>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
