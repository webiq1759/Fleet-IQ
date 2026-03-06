import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, MapPin, User, Hash, CreditCard, ShieldCheck, CalendarPlus, Download } from 'lucide-react';
import { Booking } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';
import { Button } from './Button';

interface TripDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking | null;
    viewMode?: 'renter' | 'owner';
}

export const TripDetailsModal: React.FC<TripDetailsModalProps> = ({ isOpen, onClose, booking, viewMode = 'owner' }) => {
    const { formatPrice } = usePreferences();

    const handleGoogleCalendar = () => {
        if (!booking) return;
        const text = encodeURIComponent(`Fleet IQ Booking: ${booking.assetTitle}`);
        const details = encodeURIComponent(`Booking Ref: ${booking.bookingCode}\nPickup: ${booking.pickupLocation || 'TBD'}\nDropoff: ${booking.dropoffLocation || 'TBD'}`);
        const location = encodeURIComponent(booking.pickupLocation || '');

        const formatDate = (dateStr: string) => {
            const d = new Date(dateStr);
            return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
        };

        const start = formatDate(booking.pickupDate);
        const end = formatDate(booking.returnDate);

        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`;
        window.open(url, '_blank');
    };

    const handleAppleCalendar = () => {
        if (!booking) return;
        const formatDate = (dateStr: string) => {
            const d = new Date(dateStr);
            return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
        };
        const start = formatDate(booking.pickupDate);
        const end = formatDate(booking.returnDate);

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Fleet IQ//Booking//EN',
            'BEGIN:VEVENT',
            `DTSTART:${start}`,
            `DTEND:${end}`,
            `SUMMARY:Fleet IQ Booking: ${booking.assetTitle}`,
            `DESCRIPTION:Booking Ref: ${booking.bookingCode}\\nPickup: ${booking.pickupLocation || 'TBD'}`,
            `LOCATION:${booking.pickupLocation || ''}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `booking-${booking.bookingCode || 'details'}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen || !booking) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header with Hero Image */}
                <div className="relative h-48 bg-slate-100 dark:bg-slate-800 shrink-0">
                    <img
                        src={booking.assetImage || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80'}
                        alt={booking.assetTitle}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md border border-white/30 uppercase tracking-wider">
                                    {booking.status}
                                </span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border uppercase tracking-wider
                                    ${booking.paymentStatus === 'Paid' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                                        booking.paymentStatus === 'Failed' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                            'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}
                                >
                                    {booking.paymentStatus}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-white leading-tight">{booking.assetTitle}</h2>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">

                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Pickup</span>
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{new Date(booking.pickupDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{booking.pickupTime || 'Time TBD'}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Return</span>
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{new Date(booking.returnDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">End of Trip</p>
                        </div>
                    </div>

                    {/* Locations */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" /> Locations</h4>
                            <div className="relative pl-6 space-y-4 before:absolute before:inset-y-2 before:left-[11px] before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                                <div className="relative">
                                    <div className="absolute -left-[29px] top-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 z-10" />
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Pickup Location</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{booking.pickupLocation || 'Not specified'}</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[29px] top-1 w-3 h-3 bg-slate-400 rounded-full border-2 border-white dark:border-slate-900 z-10" />
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Dropoff Location</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{booking.dropoffLocation || booking.pickupLocation || 'Not specified'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-200 dark:border-slate-800" />

                    {/* Passenger / Client Info (Only for Owners) */}
                    {viewMode === 'owner' && (
                        <>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Client Details</h4>
                                <div className="flex items-center gap-3">
                                    {booking.clientAvatar ? (
                                        <img src={booking.clientAvatar} alt={booking.clientName} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-medium">
                                            {booking.clientName.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{booking.clientName}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{booking.guests || 1} Guest{(booking.guests || 1) > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-200 dark:border-slate-800" />
                        </>
                    )}

                    {/* Booking Meta */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> Booking Ref</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{booking.bookingCode || 'Pending'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Total Amount</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(booking.totalAmount)}</p>
                        </div>
                    </div>

                    {booking.crew && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Assigned Crew</h4>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs uppercase">
                                    {booking.crew.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{booking.crew.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{booking.crew.phone}</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0 space-y-3">
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleGoogleCalendar} className="flex-1 flex items-center justify-center gap-2 text-xs h-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                            <CalendarPlus className="w-4 h-4" /> Google
                        </Button>
                        <Button variant="outline" onClick={handleAppleCalendar} className="flex-1 flex items-center justify-center gap-2 text-xs h-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                            <Download className="w-4 h-4" /> Apple/Outlook
                        </Button>
                    </div>
                    <Button onClick={onClose} className="w-full h-11">
                        Close Details
                    </Button>
                </div>

            </div>
        </div>,
        document.body
    );
};
