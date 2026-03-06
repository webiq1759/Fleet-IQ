import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, CheckCircle, Navigation, Wrench, Eye, Edit2, Trash2, Calendar, AlertTriangle, Fuel, Settings2, Users, Gauge, Search } from 'lucide-react';
import { RegistryCard } from '../../components/DashboardComponents';
import { DashboardSkeleton } from '../../components/DashboardSkeleton';
import { Asset } from '../../types';
import { usePreferences } from '../../contexts/PreferencesContext';

interface FleetRegistryProps {
    fleets: Array<Asset & { status: string; earnings: number }>;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    isLoading?: boolean;
}

export const FleetRegistry: React.FC<FleetRegistryProps> = ({ fleets, onDelete, onEdit, isLoading }) => {
    const { formatPrice } = usePreferences();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 h-24 rounded-xl border border-slate-100 dark:border-slate-800 animate-pulse" />
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 h-80 rounded-xl border border-slate-100 dark:border-slate-800 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    // Filter fleets based on search query
    const filteredFleets = fleets.filter(fleet =>
        fleet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (fleet.licensePlate && fleet.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Calculated Stats (Based on all fleets, not just filtered)
    const availableCount = fleets.filter(f => f.isAvailable).length;
    const onTripCount = fleets.filter(f => !f.isAvailable).length;
    // Calculate fleets with service due (today or past)
    const serviceDueCount = fleets.filter(f => {
        if (!f.nextServiceDate) return false;
        return new Date(f.nextServiceDate) <= new Date();
    }).length;

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-32 md:pb-0">
            {/* Fleet Status Cards - Scrollable on Mobile */}
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 pb-4 md:pb-0 pr-4 md:pr-0 no-scrollbar">
                <div className="snap-start shrink-0 w-[75vw] sm:w-[300px] md:w-auto">
                    <RegistryCard
                        title="Total Fleet"
                        value={fleets.length}
                        icon={Car}
                        bgClass="bg-blue-50 dark:bg-blue-900/20"
                        colorClass="text-blue-600 dark:text-blue-400"
                    />
                </div>
                <div className="snap-start shrink-0 w-[75vw] sm:w-[300px] md:w-auto">
                    <RegistryCard
                        title="Available"
                        value={availableCount}
                        icon={CheckCircle}
                        bgClass="bg-green-50 dark:bg-green-900/20"
                        colorClass="text-green-600 dark:text-green-400"
                    />
                </div>
                <div className="snap-start shrink-0 w-[75vw] sm:w-[300px] md:w-auto">
                    <RegistryCard
                        title="Active Trips"
                        value={onTripCount}
                        icon={Navigation}
                        bgClass="bg-indigo-50 dark:bg-indigo-900/20"
                        colorClass="text-indigo-600 dark:text-indigo-400"
                    />
                </div>
                <div className="snap-start shrink-0 w-[75vw] sm:w-[300px] md:w-auto">
                    <RegistryCard
                        title="Service Due"
                        value={serviceDueCount}
                        icon={Wrench}
                        bgClass={serviceDueCount > 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-slate-50 dark:bg-slate-800"}
                        colorClass={serviceDueCount > 0 ? "text-red-600 dark:text-red-400" : "text-slate-400"}
                    />
                </div>
            </div>

            {/* Fleet Controls (Search & Filters) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search assets by name or plate..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-colors"
                    />
                </div>
            </div>

            {/* Fleet Grid / Horizontal List Rows */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-6">
                    {filteredFleets.length > 0 ? filteredFleets.map((fleet) => {
                        const isServiceDue = fleet.nextServiceDate ? new Date(fleet.nextServiceDate) <= new Date() : false;

                        return (
                            <div
                                key={fleet.id}
                                className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-all duration-300 flex min-h-[160px] h-auto md:flex-col"
                            >
                                {/* Image Header */}
                                <div className="w-[140px] md:w-full shrink-0 relative bg-slate-100 dark:bg-slate-800 md:h-48 overflow-hidden">
                                    <img
                                        src={fleet.imageUrl}
                                        alt={fleet.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        {fleet.status === 'Pending' ? (
                                            <span className="bg-amber-500/90 text-white border-amber-400 px-1.5 py-0.5 rounded text-[9px] md:text-xs font-bold backdrop-blur-md shadow-sm border">
                                                Pending
                                            </span>
                                        ) : fleet.status === 'Rejected' ? (
                                            <span className="bg-red-500/90 text-white border-red-400 px-1.5 py-0.5 rounded text-[9px] md:text-xs font-bold backdrop-blur-md shadow-sm border">
                                                Rejected
                                            </span>
                                        ) : (
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] md:text-xs font-bold backdrop-blur-md shadow-sm border ${fleet.isAvailable
                                                ? 'bg-green-500/90 text-white border-green-400'
                                                : 'bg-slate-900/90 text-white border-slate-700'
                                                }`}>
                                                {fleet.isAvailable ? 'Avail' : 'Busy'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="absolute bottom-2 left-2">
                                        <span className="bg-black/60 backdrop-blur-md text-white text-[9px] md:text-xs px-1.5 py-0.5 rounded font-medium border border-white/10 uppercase tracking-wide">
                                            {fleet.type}
                                        </span>
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="p-3 md:p-5 flex flex-col flex-1 min-w-0">
                                    <div className="flex flex-row justify-between items-center mb-2 md:mb-4 gap-2">
                                        <h3 className="font-bold text-sm md:text-lg text-slate-900 dark:text-white truncate leading-tight flex-1" title={fleet.title}>
                                            {fleet.title}
                                        </h3>
                                        <div className="flex items-baseline shrink-0">
                                            <span className="font-bold text-xs md:text-base text-slate-900 dark:text-white leading-none whitespace-nowrap">
                                                {formatPrice(fleet.price)}
                                            </span>
                                            <span className="text-[8px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium leading-none ml-1 whitespace-nowrap">
                                                / {fleet.priceDuration === 'Custom' ? `${fleet.tripDuration}h` : (fleet.priceDuration || '24h')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Enhanced Specs Grid - Scrollable on mobile, Grid on desktop */}
                                    <div className="flex overflow-x-auto gap-1.5 mb-2 pb-2 no-scrollbar md:grid md:grid-cols-2 md:gap-3 md:mb-4 md:pb-0 whitespace-nowrap">
                                        <div className="flex items-center gap-1 text-[10px] md:text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-1 md:p-2 rounded shrink-0">
                                            <Users className="w-3 h-3 text-slate-400 shrink-0" />
                                            <span className="truncate">{fleet.specs.capacity} Pass</span>
                                        </div>
                                        {fleet.specs.transmission && (
                                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-1 md:p-2 rounded shrink-0">
                                                <Settings2 className="w-3 h-3 text-slate-400 shrink-0" />
                                                <span className="truncate">{fleet.specs.transmission}</span>
                                            </div>
                                        )}
                                        {fleet.specs.fuelType && (
                                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-1 md:p-2 rounded shrink-0">
                                                <Fuel className="w-3 h-3 text-slate-400 shrink-0" />
                                                <span className="truncate">{fleet.specs.fuelType}</span>
                                            </div>
                                        )}
                                        {fleet.specs.speed && (
                                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-1 md:p-2 rounded shrink-0">
                                                <Gauge className="w-3 h-3 text-slate-400 shrink-0" />
                                                <span className="truncate">{fleet.specs.speed}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 md:gap-4 mb-2 md:mb-4 pt-2 md:pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <div>
                                            <p className="text-[8px] md:text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider mb-0.5 md:mb-1">Earnings</p>
                                            <p className="font-semibold text-green-600 dark:text-green-400 text-xs md:text-sm truncate">{formatPrice(fleet.earnings)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] md:text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider mb-0.5 md:mb-1">Service</p>
                                            {fleet.nextServiceDate ? (
                                                <div className={`inline-flex items-center gap-1 text-[10px] md:text-xs font-medium ${isServiceDue
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-slate-600 dark:text-slate-300'
                                                    }`}>
                                                    {isServiceDue ? <AlertTriangle className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" /> : <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400 shrink-0" />}
                                                    <span className="truncate">{fleet.nextServiceDate}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] md:text-xs text-slate-400 italic">None</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions Footer */}
                                    <div className="mt-auto flex items-center justify-end gap-1 md:gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            onClick={() => navigate(`/assets/${fleet.id}`)}
                                            className="p-1.5 md:p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center text-[10px] md:text-xs font-medium"
                                            title="View"
                                        >
                                            <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1.5" /> <span className="hidden md:inline">View</span>
                                        </button>
                                        <button
                                            onClick={() => onEdit(fleet.id)}
                                            className="p-1.5 md:p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center text-[10px] md:text-xs font-medium"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1.5" /> <span className="hidden md:inline">Edit</span>
                                        </button>
                                        <button
                                            onClick={() => onDelete(fleet.id)}
                                            className="p-1.5 md:p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center text-[10px] md:text-xs font-medium"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1.5" /> <span className="hidden md:inline">Delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No fleets found</h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                                {searchQuery ? `We couldn't find any fleets matching "${searchQuery}".` : "Get started by adding your first vehicle, aircraft, or vessel to the registry."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
