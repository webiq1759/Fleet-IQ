
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, DollarSign, User, Car } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../supabaseClient';
import { Booking, Asset, BookingStatus } from '../types';

interface AddBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (booking: Partial<Booking>) => void;
    availableAssets: Asset[];
    existingBookings: Booking[];
}

export const AddBookingModal: React.FC<AddBookingModalProps> = ({ isOpen, onClose, onAdd, availableAssets, existingBookings }) => {
    const [formData, setFormData] = useState({
        clientName: '',
        assetId: '',
        pickupDate: '',
        pickupTime: '',
        returnDate: '',
        totalAmount: '',
        status: 'New' as BookingStatus
    });

    if (!isOpen) return null;

    const checkAvailability = (assetId: string, startDate: string, endDate: string) => {
        if (!startDate) return true; // Can't check without start date
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date(start); // If no return date, assume same day or open ended? assume 1 day for conflict check if single day

        // Normalize time to midnight for simple date comparison, or include time if strict
        // For now, let's just check date overlap
        const conflict = existingBookings.find(booking => {
            if (booking.assetId !== assetId) return false;
            if (booking.status === 'Cancelled' || booking.status === 'Completed') return false; // Ignored statuses

            const bStart = new Date(booking.pickupDate);
            const bEnd = booking.returnDate ? new Date(booking.returnDate) : new Date(bStart);

            // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
            return start <= bEnd && end >= bStart;
        });

        return !conflict;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const selectedAsset = availableAssets.find(a => a.id === formData.assetId);
        if (!selectedAsset) return;

        // Server-side availability check
        const { data: isAvailable, error } = await supabase.rpc('check_asset_availability', {
            p_asset_id: formData.assetId,
            p_start_date: formData.pickupDate,
            p_end_date: formData.returnDate || formData.pickupDate
        });

        if (error) {
            console.error("Availability check failed:", error);
            alert("Could not verify availability. Please try again.");
            return;
        }

        if (!isAvailable) {
            alert("This asset is already booked for the selected dates. Please choose another date or asset.");
            return;
        }

        const newBooking: Partial<Booking> = {
            clientName: formData.clientName,
            assetId: formData.assetId,
            assetTitle: selectedAsset.title,
            assetImage: selectedAsset.imageUrl,
            pickupDate: formData.pickupDate,
            pickupTime: formData.pickupTime,
            returnDate: formData.returnDate,
            totalAmount: Number(formData.totalAmount),
            status: formData.status,
            paymentStatus: formData.status === 'Paid' || formData.status === 'Assigned' ? 'Paid' : 'Pending',
            requestedOn: new Date().toISOString().split('T')[0]
        };

        onAdd(newBooking);

        // Reset form
        setFormData({
            clientName: '',
            assetId: '',
            pickupDate: '',
            pickupTime: '',
            returnDate: '',
            totalAmount: '',
            status: 'New'
        });
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Manual Booking</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Record a new booking for your fleet.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                    <form id="add-booking-form" onSubmit={handleSubmit} className="space-y-5">

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Client Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Global Energy Ltd"
                                    value={formData.clientName}
                                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Asset <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    required
                                    value={formData.assetId}
                                    onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white appearance-none"
                                >
                                    <option value="">Select an asset...</option>
                                    {availableAssets.map(asset => (
                                        <option key={asset.id} value={asset.id}>{asset.title} ({asset.type})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pickup Date <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="date"
                                        required
                                        value={formData.pickupDate}
                                        onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pickup Time <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="time"
                                        required
                                        value={formData.pickupTime}
                                        onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Return Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="date"
                                        value={formData.returnDate}
                                        onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Amount <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="number"
                                        required
                                        placeholder="0.00"
                                        min="0"
                                        value={formData.totalAmount}
                                        onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Initial Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as BookingStatus })}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                            >
                                <option value="New">New</option>
                                <option value="Paid">Paid</option>
                                <option value="Assigned">Assigned</option>
                            </select>
                        </div>

                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={(e) => handleSubmit(e as any)}
                        disabled={!formData.clientName || !formData.assetId || !formData.pickupDate || !formData.totalAmount}
                    >
                        Create Booking
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
