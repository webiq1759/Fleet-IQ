
import React, { useState } from 'react';
import { Star, ShieldCheck, Users, Gauge, Heart, Fuel, Settings2 } from 'lucide-react';
import { Asset } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';
import { useNavigate } from 'react-router-dom';

interface AssetCardProps {
  asset: Asset;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
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
      className="group bg-white dark:bg-slate-900 rounded-xl overflow-hidden hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer flex flex-col h-full"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={asset.imageUrl}
          alt={asset.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top Overlays */}
        <div className="absolute top-0 inset-x-0 p-3 flex justify-between items-center z-10">
          {/* Verified Badge */}
          {asset.owner.isVerified ? (
            <div className="bg-slate-900/80 dark:bg-black/80 backdrop-blur text-white px-2 py-1 rounded-full flex items-center shadow-sm">
              <ShieldCheck className="w-3 h-3" />
              <span className="ml-1 text-xs font-medium leading-none">Verified</span>
            </div>
          ) : <div></div>}

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className="p-2 rounded-full hover:bg-black/20 active:scale-95 transition-all focus:outline-none bg-black/10 backdrop-blur-sm"
          >
            <Heart
              className={`w-5 h-5 drop-shadow-sm transition-colors duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white fill-[rgba(0,0,0,0.3)]'}`}
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors line-clamp-1">{asset.title}</h3>
          <div className="flex items-center shrink-0 ml-2">
            {asset.rating > 0 && (
              <>
                <Star className="w-3.5 h-3.5 text-slate-900 dark:text-white fill-slate-900 dark:fill-white" />
                <span className="ml-1 text-sm font-medium text-slate-900 dark:text-white">{asset.rating.toFixed(1)}</span>
              </>
            )}
            <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">({asset.reviewCount} reviews)</span>
          </div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">{asset.location}</p>

        {/* Specs Mini-Grid - Horizontal Scrollable */}
        <div className="flex gap-2 mb-4 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded whitespace-nowrap shrink-0">
            <Users className="w-3 h-3 mr-1" />
            {asset.specs.capacity} Guests
          </div>
          {asset.specs.speed && (
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded whitespace-nowrap shrink-0">
              <Gauge className="w-3 h-3 mr-1" />
              {asset.specs.speed}
            </div>
          )}
          {asset.specs.fuelType && (
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded whitespace-nowrap shrink-0">
              <Fuel className="w-3 h-3 mr-1" />
              {asset.specs.fuelType}
            </div>
          )}
          {asset.specs.transmission && (
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded whitespace-nowrap shrink-0">
              <Settings2 className="w-3 h-3 mr-1" />
              {asset.specs.transmission}
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-baseline">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatPrice(asset.price)}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px] ml-1">
              / {asset.priceDuration === 'Custom' ? `${asset.tripDuration}h` : (asset.priceDuration || '24h')}
            </span>
          </div>
          {asset.specs.crewIncluded && (
            <span className="text-[9px] font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
              Crew Included
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
