import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface ScheduledTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmTrip?: () => void;
    isConfirming?: boolean;
    trip: {
        assetTitle: string;
        pickupDate: string;
        pickupTime: string;
        pickupLocation: string;
        dropoffLocation: string;
        status?: string;
        crew?: {
            name: string;
            phone: string;
            photo?: string;
        };
    } | null;
}

export const ScheduledTripModal: React.FC<ScheduledTripModalProps> = ({ isOpen, onClose, onConfirmTrip, isConfirming, trip }) => {
    if (!isOpen || !trip) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                        Trip Details
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        Trip details for <strong>{trip.assetTitle}</strong>.
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 text-left">

                        {/* Status Badge */}
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-xs text-slate-500 uppercase font-semibold">Status</span>
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                {trip.status || 'Scheduled'}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Calendar className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</p>
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {new Date(trip.pickupDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</p>
                                <p className="font-medium text-slate-900 dark:text-white">{trip.pickupTime}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex flex-col items-center gap-1 pt-1">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <div className="w-0.5 h-6 bg-slate-200 dark:bg-slate-700" />
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pickup</p>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{trip.pickupLocation || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dropoff</p>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{trip.dropoffLocation || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Crew Details Section */}
                        {trip.crew && (
                            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Crew Details</p>
                                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                                        {trip.crew.photo ? (
                                            <img src={trip.crew.photo} alt={trip.crew.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-slate-500 font-bold text-xs">{trip.crew.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{trip.crew.name}</p>
                                        <p className="text-xs text-slate-500">{trip.crew.phone}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    {trip.status === 'Awaiting Confirmation' && onConfirmTrip && (
                        <Button
                            onClick={onConfirmTrip}
                            disabled={isConfirming}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:text-white"
                        >
                            {isConfirming ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Confirming...
                                </span>
                            ) : (
                                'Confirm Complete'
                            )}
                        </Button>
                    )}
                    <Button
                        onClick={onClose}
                        className={trip.status === 'Awaiting Confirmation' && onConfirmTrip ? 'flex-1 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700' : 'w-full'}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
