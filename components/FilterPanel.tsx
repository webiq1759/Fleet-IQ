import React, { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { Button } from './Button';
import { AssetType } from '../types';

export interface FilterState {
  priceMin: number;
  priceMax: number;
  capacity: number;
  crewIncluded: boolean;
  verifiedOnly: boolean;
  transmission: string;
  fuelType: string;
  location: string;
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: AssetType | null;
  initialFilters: FilterState | null;
  onApplyFilters: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ isOpen, onClose, activeCategory, initialFilters, onApplyFilters, onClearFilters }) => {
  const [priceMin, setPriceMin] = useState(initialFilters?.priceMin ?? 0);
  const [priceMax, setPriceMax] = useState(initialFilters?.priceMax ?? 50000);
  const [capacity, setCapacity] = useState(initialFilters?.capacity ?? 1);
  const [crewIncluded, setCrewIncluded] = useState(initialFilters?.crewIncluded ?? false);
  const [verifiedOnly, setVerifiedOnly] = useState(initialFilters?.verifiedOnly ?? false);
  const [transmission, setTransmission] = useState<string>(initialFilters?.transmission ?? '');
  const [fuelType, setFuelType] = useState<string>(initialFilters?.fuelType ?? '');
  const [location, setLocation] = useState<string>(initialFilters?.location ?? '');

  // Reset local state when opened with new initialFilters
  React.useEffect(() => {
    if (isOpen) {
      setPriceMin(initialFilters?.priceMin ?? 0);
      setPriceMax(initialFilters?.priceMax ?? 50000);
      setCapacity(initialFilters?.capacity ?? 1);
      setCrewIncluded(initialFilters?.crewIncluded ?? false);
      setVerifiedOnly(initialFilters?.verifiedOnly ?? false);
      setTransmission(initialFilters?.transmission ?? '');
      setFuelType(initialFilters?.fuelType ?? '');
      setLocation(initialFilters?.location ?? '');
    }
  }, [isOpen, initialFilters]);

  const handleApply = () => {
    onApplyFilters({
      priceMin,
      priceMax,
      capacity,
      crewIncluded,
      verifiedOnly,
      transmission,
      fuelType,
      location
    });
    onClose();
  };

  const handleClear = () => {
    onClearFilters();
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-[60] flex justify-end ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Filters</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {activeCategory ? `Refine ${activeCategory.toLowerCase()} options` : 'Refine search results'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* Price Range */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Price Range (Daily)</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Min Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">$</span>
                  <input
                    type="number"
                    value={priceMin}
                    onChange={(e) => setPriceMin(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              <div className="text-slate-400">-</div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Max Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">$</span>
                  <input
                    type="number"
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Capacity */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Capacity</h3>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Minimum Passengers</span>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCapacity(Math.max(1, capacity - 1))}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-4 text-center font-medium text-slate-900 dark:text-white">{capacity}</span>
                <button
                  onClick={() => setCapacity(capacity + 1)}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Vehicle Specs */}
          {(activeCategory === 'CARS' || activeCategory === 'TRUCKS' || activeCategory === null) && (
            <>
              <section>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Vehicle Specs</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 dark:text-slate-400 block">Transmission</label>
                    <div className="flex flex-wrap gap-2">
                      {['Automatic', 'Manual'].map(type => (
                        <button
                          key={type}
                          onClick={() => setTransmission(transmission === type ? '' : type)}
                          className={`px-3 py-1.5 border rounded-lg text-sm transition-colors ${transmission === type
                            ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-red-500'
                            }`}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 dark:text-slate-400 block">Fuel Type</label>
                    <div className="flex flex-wrap gap-2">
                      {['Gasoline', 'Diesel', 'Electric', 'Hybrid'].map(type => (
                        <button
                          key={type}
                          onClick={() => setFuelType(fuelType === type ? '' : type)}
                          className={`px-3 py-1.5 border rounded-lg text-sm transition-colors ${fuelType === type
                            ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-red-500'
                            }`}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
              <div className="h-px bg-slate-100 dark:bg-slate-800" />
            </>
          )}

          {/* Amenities / Specs */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Specifications</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Crew Included</span>
                <div
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${crewIncluded ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                  onClick={() => setCrewIncluded(!crewIncluded)}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${crewIncluded ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Verified Owners Only</span>
                <div
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${verifiedOnly ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${verifiedOnly ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </label>
            </div>
          </section>

          {/* Location Placeholder */}
          <div className="h-px bg-slate-100 dark:bg-slate-800" />
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Location</h3>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Lagos, Abuja, London"
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
            />
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 safe-bottom">
          <div className="flex gap-4">
            <Button variant="ghost" onClick={handleClear} className="flex-1 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">Clear all</Button>
            <Button fullWidth onClick={handleApply} className="flex-[2]">Show results</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
