import React, { useState } from 'react';
import { Star, ShieldCheck, Users, Gauge, Heart, Fuel, Settings2, MapPin } from 'lucide-react';
import { Asset } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';
import { useNavigate } from 'react-router-dom';

interface AssetListCardProps {
    asset: Asset;
}

export const AssetListCard: React.FC<AssetListCardProps> = ({ asset }) => {
    const { formatPrice } = usePreferences();
    const navigate = useNavigate();

    // Initialize state from localStorage
    const [isFavorite, setIsFavorite] = useState(() => {
        if (typeof window === 'undefined') return false;
        try {
            const saved = localStorage.getItem('fleet-iq-favorites');
            return saved ? JSON.parse(saved).includes(asset.id) : false;
        } catch (e) {
            return false;
        }
    });

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const newState = !isFavorite;
        setIsFavorite(newState);

        try {
            const saved = localStorage.getItem('fleet-iq-favorites');
            let favorites: string[] = saved ? JSON.parse(saved) : [];

            if (newState) {
                if (!favorites.includes(asset.id)) {
                    favorites.push(asset.id);
                }
            } else {
                favorites = favorites.filter(id => id !== asset.id);
            }

            localStorage.setItem('fleet-iq-favorites', JSON.stringify(favorites));
        } catch (e) {
            console.error('Failed to save favorite', e);
        }
    };

    return (
        <div
            onClick={() => navigate(`/assets/${asset.id}`)}
            className="group bg-white dark:bg-slate-900 rounded-xl overflow-hidden hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-300 border border-slate-200 dark:border-slate-800 cursor-pointer flex h-[120px] sm:h-[148px]"
        >
            {/* Image Container */}
            <div className="w-[120px] sm:w-[180px] shrink-0 relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                    src={asset.imageUrl}
                    alt={asset.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Top Overlays */}
                <div className="absolute top-0 inset-x-0 p-2 sm:p-2.5 flex justify-between items-center z-10">
                    {/* Verified Badge */}
                    {asset.owner.isVerified ? (
                        <div className="bg-slate-900/80 dark:bg-black/80 backdrop-blur text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full flex items-center shadow-sm">
                            <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="ml-1 text-[10px] sm:text-xs font-medium hidden sm:inline leading-none">Verified</span>
                        </div>
                    ) : <div></div>}

                    {/* Favorite Button */}
                    <button
                        onClick={handleFavoriteClick}
                        className="p-1 sm:p-1.5 rounded-full hover:bg-black/20 active:scale-95 transition-all focus:outline-none bg-black/10 backdrop-blur-sm"
                    >
                        <Heart
                            className={`w-4 h-4 sm:w-4 sm:h-4 drop-shadow-sm transition-colors duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white fill-[rgba(0,0,0,0.3)]'}`}
                            strokeWidth={2}
                        />
                    </button>
                </div>
            </div>

            {/* Content Container */}
            <div className="p-3 sm:p-4 flex flex-col flex-1 min-w-0 relative">
                <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 pr-2">
                        <h3 className="font-bold text-sm sm:text-lg text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors truncate">
                            {asset.title}
                        </h3>
                    </div>
                    <div className="flex items-center shrink-0">
                        {asset.rating > 0 && (
                            <>
                                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-slate-900 dark:text-white fill-slate-900 dark:fill-white" />
                                <span className="ml-0.5 sm:ml-1 text-xs sm:text-sm font-medium text-slate-900 dark:text-white">{asset.rating.toFixed(1)}</span>
                            </>
                        )}
                        <span className="hidden sm:inline ml-1 text-xs text-slate-500 dark:text-slate-400">({asset.reviewCount} reviews)</span>
                    </div>
                </div>

                {/* Specs Row - Single horizontal line */}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 overflow-x-auto no-scrollbar whitespace-nowrap pb-1">
                    <div className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-300 shrink-0">
                        {asset.specs.capacity} seats
                    </div>
                    {asset.specs.fuelType && (
                        <div className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-300 shrink-0">
                            {asset.specs.fuelType}
                        </div>
                    )}
                    {asset.specs.transmission && (
                        <div className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-300 shrink-0">
                            {asset.specs.transmission}
                        </div>
                    )}
                    {asset.specs.crewIncluded && (
                        <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide shrink-0">
                            Crew Included
                        </div>
                    )}
                </div>

                <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm truncate pr-2">
                        <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 shrink-0 text-red-500" />
                        <span className="truncate">{asset.location}</span>
                    </div>

                    {/* Prominent Price - No Green Background */}
                    <div className="shrink-0 flex items-baseline">
                        <div className="font-bold text-sm sm:text-lg text-slate-900 dark:text-white leading-none">
                            {formatPrice(asset.price)}
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wide leading-none">
                            / {asset.priceDuration === 'Custom' ? `${asset.tripDuration}h` : (asset.priceDuration || '24h')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
