import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Search } from 'lucide-react';
import { Booking } from '../types';
import { TripDetailsModal } from './TripDetailsModal';

// Creating native implementations to avoid dependency issues since date-fns isn't listed in package.json
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

export const BookingsCalendar = ({ bookings, viewMode = 'owner' }: { bookings: Booking[], viewMode?: 'renter' | 'owner' }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    // Native grid generation
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Pad the beginning of the month
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }

    // Add the days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }

    // Ensure grid is multiple of 7
    while (days.length % 7 !== 0) {
        days.push(null);
    }

    const getBookingsForDay = (day: Date) => {
        return bookings.filter(b => {
            const bDate = new Date(`${b.pickupDate}T${b.pickupTime || '00:00:00'}`);
            return bDate.getFullYear() === day.getFullYear() &&
                bDate.getMonth() === day.getMonth() &&
                bDate.getDate() === day.getDate();
        });
    };

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-white dark:bg-slate-900 sm:rounded-2xl border-y sm:border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300 mb-24 lg:mb-0 -mx-4 sm:mx-0">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-none bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-start sm:items-center gap-3 w-full">
                    <div className="p-2 sm:p-2.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl shrink-0">
                        <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">Bookings Calendar</h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">View and manage your upcoming schedules</p>
                    </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto gap-4 bg-white dark:bg-slate-900 p-1 sm:p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1.5 sm:p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors bg-slate-50 dark:bg-slate-800/50 sm:bg-transparent"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-semibold text-slate-900 dark:text-white min-w-[120px] text-center text-sm sm:text-base">
                        {monthName} {year}
                    </span>
                    <button
                        onClick={handleNextMonth}
                        className="p-1.5 sm:p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors bg-slate-50 dark:bg-slate-800/50 sm:bg-transparent"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="p-0 sm:p-6 overflow-x-auto">
                <div className="min-w-[800px] grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 sm:rounded-xl overflow-hidden shadow-inner border sm:border-slate-200 sm:dark:border-slate-800">

                    {/* Day Headers */}
                    {dayNames.map(day => (
                        <div key={day} className="bg-slate-50 dark:bg-slate-900/50 p-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}

                    {/* Calendar Cells */}
                    {days.map((day, idx) => {
                        if (!day) {
                            return <div key={`empty-${idx}`} className="bg-slate-50/50 dark:bg-slate-900/20 min-h-[140px] p-2 border-t border-slate-200 dark:border-slate-800" />;
                        }

                        const dayBookings = getBookingsForDay(day);
                        const isToday = new Date().toDateString() === day.toDateString();

                        return (
                            <div
                                key={day.toISOString()}
                                className={`bg-white dark:bg-slate-900 min-h-[140px] p-2 flex flex-col transition-colors border-t border-slate-200 dark:border-slate-800
                  ${isToday ? 'bg-red-50/30 dark:bg-red-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold
                    ${isToday
                                            ? 'bg-red-600 text-white shadow-md'
                                            : 'text-slate-700 dark:text-slate-300'}`}
                                    >
                                        {day.getDate()}
                                    </span>
                                    {dayBookings.length > 0 && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500">
                                            {dayBookings.length}
                                        </span>
                                    )}
                                </div>

                                <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
                                    {dayBookings.map(b => (
                                        <div
                                            key={b.id}
                                            onClick={() => { setSelectedBooking(b); setIsModalOpen(true); }}
                                            className="text-xs p-2 rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 hover:border-red-200 dark:hover:border-red-900 hover:shadow-sm transition-all cursor-pointer group relative overflow-hidden"
                                            title={`${b.clientName} - ${b.pickupLocation || 'No pickup specified'}`}
                                        >
                                            {/* Gradient Accent based on status */}
                                            <div className={`absolute top-0 left-0 bottom-0 w-1 ${b.status === 'Completed' ? 'bg-green-500' :
                                                b.status === 'Ongoing' || b.status === 'Trip' ? 'bg-blue-500' :
                                                    b.status === 'Assigned' || b.status === 'Paid' || b.status === 'New' ? 'bg-amber-500' :
                                                        b.status === 'Cancelled' ? 'bg-red-500' : 'bg-slate-300'}`} />

                                            <div className="pl-1.5">
                                                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-red-600 dark:group-hover:text-red-400">
                                                    {b.clientName}
                                                </div>
                                                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mt-1">
                                                    <Clock className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{new Date(`${b.pickupDate}T${b.pickupTime || '00:00:00'}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div className="hidden sm:flex items-center gap-1 text-slate-500 dark:text-slate-400 mt-0.5">
                                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{b.pickupLocation || b.dropoffLocation || 'TBD'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <TripDetailsModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setTimeout(() => setSelectedBooking(null), 200); }}
                booking={selectedBooking}
                viewMode={viewMode}
            />
        </div>
    );
};
