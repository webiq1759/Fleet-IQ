import React, { useState } from 'react';
import { Asset } from '../types';
import { AssetCard } from './AssetCard';
import { MapPin, X } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';

interface MapViewProps {
  assets: Asset[];
}

export const MapView: React.FC<MapViewProps> = ({ assets }) => {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const { formatPrice } = usePreferences();

  // Nigeria Approximate Bounds for Projection
  const MIN_LAT = 4.0;
  const MAX_LAT = 14.0;
  const MIN_LNG = 2.5;
  const MAX_LNG = 14.5;

  // Simple linear projection to convert lat/lng to percentage top/left
  const getPosition = (lat: number, lng: number) => {
    // Latitude maps to vertical (Top is Max Lat, Bottom is Min Lat)
    // 100% Top is Min Lat? No, 0% Top is Max Lat usually in maps
    // Let's assume standard map orientation: North is Up (0% top)
    const top = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * 100;

    // Longitude maps to horizontal (Left is Min Lng)
    const left = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * 100;

    return { top: `${top}%`, left: `${left}%` };
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-[#e5e7eb] overflow-hidden">
      {/* Abstract Map Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="#94a3b8" />
          {/* Abstract Shapes resembling landmass/water separation */}
          <path d="M0,50 Q25,30 50,50 T100,50 V100 H0 Z" fill="#64748b" opacity="0.2" />
        </svg>
        {/* Grid lines */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.2
          }}
        />
      </div>

      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm">
        <h3 className="font-bold text-slate-900">Map View</h3>
        <p className="text-xs text-slate-500">{assets.length} assets found</p>
      </div>

      {/* Pins */}
      {assets.map((asset) => {
        const { top, left } = getPosition(asset.coordinates?.lat || 0, asset.coordinates?.lng || 0);
        const isSelected = selectedAsset?.id === asset.id;

        return (
          <div
            key={asset.id}
            className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer transition-all duration-300 hover:scale-110 z-20 group"
            style={{ top, left }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAsset(asset);
            }}
          >
            <div className={`
                flex flex-col items-center
                ${isSelected ? 'scale-110 z-30' : ''}
            `}>
              <div className={`
                    px-3 py-1.5 rounded-full font-bold text-sm shadow-md whitespace-nowrap mb-1 transition-colors
                    ${isSelected
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white text-slate-900 hover:bg-slate-900 hover:text-white dark:bg-slate-800 dark:text-white'}
                `}>
                {formatPrice(asset.price)}
              </div>
              <div className="text-red-600 drop-shadow-md">
                <MapPin className={`w-8 h-8 ${isSelected ? 'fill-red-600' : 'fill-white'}`} strokeWidth={1.5} />
              </div>
            </div>
          </div>
        );
      })}

      {/* Selected Asset Popup */}
      {selectedAsset && (
        <div className="absolute bottom-8 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-[360px] z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="relative">
            <button
              onClick={() => setSelectedAsset(null)}
              className="absolute -top-3 -right-3 z-10 bg-slate-900 text-white rounded-full p-1.5 shadow-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <AssetCard asset={selectedAsset} />
          </div>
        </div>
      )}
    </div>
  );
};