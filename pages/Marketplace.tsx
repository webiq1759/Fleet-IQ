import React, { useState } from 'react';
import { CATEGORIES, MOCK_ASSETS_DATA } from '../constants';
import { AssetCard } from '../components/AssetCard';
import { SlidersHorizontal, MapPin, List } from 'lucide-react';
import { AssetType } from '../types';
import { FilterPanel } from '../components/FilterPanel';
import { MapView } from '../components/MapView';

export const Marketplace = () => {
  const [activeCategory, setActiveCategory] = useState<AssetType | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMapView, setIsMapView] = useState(false);

  const filteredAssets = activeCategory 
    ? MOCK_ASSETS_DATA.filter(a => a.type === activeCategory)
    : MOCK_ASSETS_DATA;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-200">
      {/* Filters Sticky Header */}
      <div className="sticky top-16 z-40 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            
            {/* Category Toggle (Segmented Control) */}
            <div className="flex-1 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
               <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 min-w-max">
                {CATEGORIES.map((cat) => {
                  const isActive = (activeCategory === cat.type) || (activeCategory === null && cat.type === null);
                  return (
                    <button
                      key={cat.label}
                      onClick={() => setActiveCategory(cat.type)}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <span className={`mr-2 transition-colors ${isActive ? 'text-red-600 dark:text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                        {cat.icon}
                      </span>
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Desktop Filter Button */}
            <div className="hidden md:block pl-4 border-l border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>

            {/* Mobile Filter Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero / CTA for Mobile (Context) */}
      {!isMapView && (
        <div className="md:hidden px-4 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-xl flex items-center justify-between shadow-sm">
             <div>
               <h3 className="font-bold">Need a Pilot?</h3>
               <p className="text-xs text-slate-400">All aircraft come with verified crew.</p>
             </div>
             <button className="text-xs bg-white text-slate-900 px-3 py-1.5 rounded font-bold hover:bg-slate-100 transition-colors">Details</button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`transition-opacity duration-300 ${isMapView ? 'h-[calc(100vh-64px)] overflow-hidden' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        {isMapView ? (
          <MapView assets={filteredAssets} />
        ) : (
          <>
            {filteredAssets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                {filteredAssets.map((asset) => (
                  <AssetCard 
                    key={asset.id} 
                    asset={asset} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                  <MapPin className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">No assets found</h3>
                <p className="text-slate-500 dark:text-slate-400">Try changing your category or filters.</p>
              </div>
            )}
          </>
        )}
      </main>
      
      {/* Floating Toggle Button */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
        <button 
          onClick={() => setIsMapView(!isMapView)}
          className="bg-slate-900 dark:bg-red-600 hover:bg-slate-800 dark:hover:bg-red-700 text-white px-5 py-3 rounded-full font-medium shadow-xl flex items-center transition-transform hover:scale-105 border border-transparent dark:border-red-500"
        >
          {isMapView ? (
             <>
               <List className="w-4 h-4 mr-2" />
               List View
             </>
          ) : (
             <>
               <MapPin className="w-4 h-4 mr-2" />
               Map View
             </>
          )}
        </button>
      </div>

      <FilterPanel 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)} 
        activeCategory={activeCategory}
      />
    </div>
  );
};