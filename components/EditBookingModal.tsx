import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Booking, BookingStatus } from '../types';
import { Button } from './Button';

interface EditBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking;
    onUpdate: (id: string, updates: Partial<Booking>) => void;
}

export const EditBookingModal: React.FC<EditBookingModalProps> = ({ isOpen, onClose, booking, onUpdate }) => {
    const [status, setStatus] = useState<BookingStatus>(booking.status);
    const [paymentStatus, setPaymentStatus] = useState<'Pending' | 'Paid' | 'Failed'>(booking.paymentStatus);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        onUpdate(booking.id, { status, paymentStatus });
        setIsLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Booking</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Booking Reference
                        </label>
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 text-sm">
                            {booking.bookingCode || booking.id.substring(0, 8).toUpperCase()}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Trip Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as BookingStatus)}
                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-transparent py-2 px-3"
                        >
                            <option value="New">New</option>
                            <option value="Assigned">Assigned</option>
                            <option value="Trip">Trip In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Payment Status
                        </label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value as any)}
                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-transparent py-2 px-3"
                        >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Failed">Failed</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
