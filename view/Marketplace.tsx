
import React, { useState, useEffect, useRef } from 'react';
import { CATEGORIES } from '../constants';
import { AssetCard } from '../components/AssetCard';
import { AssetListCard } from '../components/AssetListCard';
import { AssetCardSkeleton } from '../components/AssetCardSkeleton';
import { SlidersHorizontal, MapPin, List, AlertCircle, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { AssetType, Asset } from '../types';
import { FilterPanel, FilterState } from '../components/FilterPanel';
import { MapView } from '../components/MapView';
import { supabase } from '../supabaseClient';
import { useSearchParams, useNavigate } from 'react-router-dom';

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

// Component for Horizontal Scroll Row
const AssetRow: React.FC<{ title: string; assets: Asset[], viewMode?: 'grid' | 'list' }> = ({ title, assets, viewMode = 'grid' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Limit to maximum 15 items
  const displayAssets = assets.slice(0, 15);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (displayAssets.length === 0) return null;

  if (viewMode === 'list') {
    return (
      <div className="mb-6 md:mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{displayAssets.length} available</p>
          </div>
          <div className="hidden md:flex gap-2">
            <button onClick={() => scroll('left')} className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <button onClick={() => scroll('right')} className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={scrollRef} className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x snap-mandatory">
            {displayAssets.map(asset => (
              <div key={asset.id} className="snap-start shrink-0 min-w-[85vw] w-[85vw] md:min-w-[48%] md:w-[48%] lg:min-w-[480px] lg:w-[480px] xl:min-w-[550px] xl:w-[550px]">
                <AssetListCard asset={asset} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 md:mb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{displayAssets.length} available</p>
        </div>
        <div className="hidden md:flex gap-2">
          <button onClick={() => scroll('left')} className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <button onClick={() => scroll('right')} className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-5 pb-4 no-scrollbar snap-x snap-mandatory"
        >
          {displayAssets.map(asset => (
            <div key={asset.id} className="min-w-[260px] w-[260px] md:min-w-[260px] md:w-[260px] lg:min-w-[230px] lg:w-[230px] xl:min-w-[225px] xl:w-[225px] snap-start">
              <AssetCard asset={asset} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Marketplace = () => {
  const [activeCategory, setActiveCategory] = useState<AssetType | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('fleet-iq-view-mode') as 'grid' | 'list') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('fleet-iq-view-mode', viewMode);
  }, [viewMode]);
  const [isMapView, setIsMapView] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<FilterState | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read params from URL
  const searchQuery = searchParams.get('search');
  const isNearby = searchParams.get('nearby') === 'true';
  const paramLat = searchParams.get('lat');
  const paramLng = searchParams.get('lng');
  const userLat = paramLat ? parseFloat(paramLat) : null;
  const userLng = paramLng ? parseFloat(paramLng) : null;

  const isFiltering = !!(searchQuery || isNearby || activeFilters);

  useEffect(() => {
    fetchAssets();
  }, [activeCategory, searchQuery, isNearby, userLat, userLng, activeFilters]);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      let query = supabase.rpc('get_marketplace_assets', {
        p_category: (activeCategory === AssetType.VEHICLE) ? null : (activeCategory || null),
        p_search: searchQuery || null,
        p_user_lat: userLat,
        p_user_lng: userLng
      });

      // No need for .eq('type', ...) here as RPC handles it via p_category
      // No need for .eq('is_available', ...) as RPC handles it
      // No need for .or(...) search as RPC handles it via p_search


      // Call RPC
      const { data, error } = await query;

      if (error) throw error;

      let mappedAssets: Asset[] = [];

      if (data) {
        // RPC already filters for crew assignment, so data contains valid assets only
        mappedAssets = data.map((dbAsset: any) => {
          return {
            id: dbAsset.id,
            title: dbAsset.title,
            type: dbAsset.type as AssetType,
            price: Number(dbAsset.price),
            priceDuration: dbAsset.price_duration,
            tripDuration: dbAsset.trip_duration,
            currency: dbAsset.currency,
            imageUrl: dbAsset.image_url,
            gallery: dbAsset.gallery || [],
            location: dbAsset.location || 'Unknown Location',
            country: dbAsset.country,
            state: dbAsset.state,
            coordinates: { lat: dbAsset.lat || 0, lng: dbAsset.lng || 0 },
            rating: Number(dbAsset.avg_rating), // RPC returns pre-calculated
            reviewCount: Number(dbAsset.review_count), // RPC returns pre-calculated
            isAvailable: dbAsset.is_available,
            description: dbAsset.description,
            features: dbAsset.features || [],
            specs: dbAsset.specs || { capacity: 4, crewIncluded: true },
            owner: {
              id: dbAsset.owner_id,
              name: dbAsset.owner_profile?.company_name || dbAsset.owner_profile?.full_name || 'Host',
              isVerified: dbAsset.owner_profile?.is_verified,
              type: dbAsset.owner_profile?.company_name ? 'COMPANY' : 'INDIVIDUAL',
              avatarUrl: dbAsset.owner_profile?.avatar_url,
              isSuperhost: dbAsset.owner_profile?.is_superhost,
              joinedDate: dbAsset.owner_profile?.created_at ? new Date(dbAsset.owner_profile.created_at).getFullYear().toString() : '2024'
            },
            ratingCategories: { cleanliness: 5, accuracy: 5, tripExperience: 5, communication: 5, location: 5, value: 5 },
            reviews: [],
            crewIds: dbAsset.crew_ids || [],
            status: dbAsset.status,
            licensePlate: dbAsset.license_plate,
            documents: dbAsset.documents || { registration: '', insurance: '' },
            convoyDetails: dbAsset.convoy_details || []
          };
        });

        // Special handling: If "Vehicles" is selected, we want to show both VEHICLE and CONVOY types
        // Since we fetched ALL categories (p_category=null) for this case, we filter manually here.
        if (activeCategory === AssetType.VEHICLE) {
          mappedAssets = mappedAssets.filter(a =>
            a.type === AssetType.VEHICLE || a.type === AssetType.CONVOY
          );
        }
      }

      // 2. Fetch Real Reviews for these assets (Client-side aggregation to ensure accuracy)
      // This matches the logic in PublicBookingPage.tsx
      const assetIds = mappedAssets.map(a => a.id);
      let reviewsMap: Record<string, { count: number, totalRating: number }> = {};

      if (assetIds.length > 0) {
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('asset_id, rating')
          .in('asset_id', assetIds);

        if (reviewsData) {
          reviewsData.forEach((review: any) => {
            if (!reviewsMap[review.asset_id]) {
              reviewsMap[review.asset_id] = { count: 0, totalRating: 0 };
            }
            reviewsMap[review.asset_id].count++;
            reviewsMap[review.asset_id].totalRating += (review.rating || 0);
          });
        }
      }

      // Update assets with real review data
      mappedAssets = mappedAssets.map(asset => {
        const realReviews = reviewsMap[asset.id] || { count: 0, totalRating: 0 };
        const reviewCount = realReviews.count > 0 ? realReviews.count : (asset.reviewCount || 0);
        const avgRating = realReviews.count > 0 ? (realReviews.totalRating / realReviews.count) : (asset.rating || 0);

        return {
          ...asset,
          rating: avgRating,
          reviewCount: reviewCount
        };
      });

      // Apply Frontend Phase Filters
      if (activeFilters) {
        mappedAssets = mappedAssets.filter(a => {
          if (activeFilters.priceMin > 0 && a.price < activeFilters.priceMin) return false;
          if (activeFilters.priceMax > 0 && a.price > activeFilters.priceMax) return false;
          if (activeFilters.capacity > 1 && (a.specs?.capacity || 0) < activeFilters.capacity) return false;
          if (activeFilters.crewIncluded && !a.specs?.crewIncluded) return false;
          if (activeFilters.verifiedOnly && !a.owner?.isVerified) return false;

          if (activeFilters.transmission) {
            const hasTransmission = a.features?.some(f => f.toLowerCase() === activeFilters.transmission.toLowerCase()) ||
              a.specs?.transmission === activeFilters.transmission;
            if (!hasTransmission) return false;
          }

          if (activeFilters.fuelType) {
            const hasFuel = a.features?.some(f => f.toLowerCase() === activeFilters.fuelType.toLowerCase()) ||
              a.specs?.fuelType === activeFilters.fuelType;
            if (!hasFuel) return false;
          }

          if (activeFilters.location) {
            const queryLoc = activeFilters.location.toLowerCase();
            if (!(a.location || '').toLowerCase().includes(queryLoc)) return false;
          }

          return true;
        });
      }

      // Apply Phase 1 FleetMatch Algorithm Sorting
      mappedAssets.sort((a, b) => {
        // 1. Exact Location Match Priority (if search query exists)
        if (searchQuery) {
          const queryLower = searchQuery.toLowerCase();
          const aMatch = (a.location || '').toLowerCase().includes(queryLower);
          const bMatch = (b.location || '').toLowerCase().includes(queryLower);
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
        }

        // 2. Renter's Favorite Status priority
        const aIsFavorite = a.reviewCount >= 5 && a.rating >= 4.8;
        const bIsFavorite = b.reviewCount >= 5 && b.rating >= 4.8;

        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;

        // 3. Fallback: Highest Review Count, then Rating
        if (b.reviewCount !== a.reviewCount) {
          return b.reviewCount - a.reviewCount;
        }
        return b.rating - a.rating;
      });

      // NO MOCK FALLBACK - REAL DATA ONLY
      setAssets(mappedAssets);

      // Handle Nearby Sorting
      if (isNearby && userLat && userLng) {
        setAssets(prevAssets => {
          const sorted = [...prevAssets].sort((a, b) => {
            const distA = calculateDistance(userLat, userLng, a.coordinates.lat, a.coordinates.lng);
            const distB = calculateDistance(userLat, userLng, b.coordinates.lat, b.coordinates.lng);
            return distA - distB;
          });
          return sorted;
        });
      }

    } catch (err) {
      console.error("Error fetching marketplace assets:", err);
      setAssets([]); // Empty on error to respect "no dummy data"
    } finally {
      setIsLoading(false);
    }
  };

  // Group assets logic for default view
  const getGroupedAssets = () => {
    // Trending section uses Phase 1 FleetMatch scoring (Favorites first, then highest rating)
    const trending = [...assets].sort((a, b) => {
      const aIsFav = a.reviewCount >= 5 && a.rating >= 4.8;
      const bIsFav = b.reviewCount >= 5 && b.rating >= 4.8;
      if (aIsFav && !bIsFav) return -1;
      if (!aIsFav && bIsFav) return 1;

      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.reviewCount - a.reviewCount;
    }).slice(0, 15);

    const cityGroups: Record<string, Asset[]> = {};
    assets.forEach(asset => {
      // Safety check for location
      const loc = asset.location || 'Unknown';
      if (loc) {
        const city = loc.split(',')[0].trim();
        if (!cityGroups[city]) cityGroups[city] = [];
        if (cityGroups[city].length < 15) {
          cityGroups[city].push(asset);
        }
      }
    });

    return { trending, cityGroups };
  };

  const { trending, cityGroups } = getGroupedAssets();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-200 pb-24 md:pb-0">
      {/* Filters Sticky Header - Desktop Only */}
      <div className="hidden md:sticky md:top-16 md:z-40 md:block bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">

            {/* Category Toggle */}
            <div className="flex-1 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 min-w-max">
                {CATEGORIES.map((cat) => {
                  const isActive = (activeCategory === cat.type) || (activeCategory === null && cat.type === null);
                  return (
                    <button
                      key={cat.label}
                      onClick={() => setActiveCategory(cat.type)}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive
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

            {/* Filter & View Modes */}
            <div className="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-700">
              <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Result Feedback */}
      {(searchQuery || isNearby) && !isLoading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {isNearby
                ? `Showing ${assets.length} results near your location`
                : activeFilters
                  ? `Showing ${assets.length} filtered results`
                  : `Showing ${assets.length} results for "${searchQuery}"`
              }
            </span>
            {(searchQuery || isNearby || activeFilters) && (
              <button
                onClick={() => {
                  navigate('/');
                  setActiveFilters(null);
                }}
                className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`transition-opacity duration-300 ${isMapView ? 'h-[calc(100vh-64px)] overflow-hidden' : 'py-8'}`}>
        {isMapView ? (
          <MapView assets={assets} />
        ) : (
          <>
            {isLoading ? (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-5 gap-y-10">
                {[...Array(10)].map((_, i) => (
                  <AssetCardSkeleton key={i} />
                ))}
              </div>
            ) : assets.length > 0 ? (
              // Display Logic
              isFiltering ? (
                <div className={`mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl`}>
                  <div className={viewMode === 'list' ? "flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x snap-mandatory" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-5 gap-y-10"}>
                    {assets.map((asset) => (
                      viewMode === 'list' ? (
                        <div key={asset.id} className="snap-start shrink-0 min-w-[85vw] w-[85vw] md:min-w-[48%] md:w-[48%] lg:min-w-[480px] lg:w-[480px] xl:min-w-[550px] xl:w-[550px]">
                          <AssetListCard asset={asset} />
                        </div>
                      ) : (
                        <AssetCard key={asset.id} asset={asset} />
                      )
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <AssetRow title="Trending on Fleet IQ" assets={trending} viewMode={viewMode} />

                  {Object.keys(cityGroups).map(city => (
                    <AssetRow
                      key={city}
                      title={`Top fleets in ${city}`}
                      assets={cityGroups[city]}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                  <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">No assets available</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                  {searchQuery || activeFilters
                    ? `No matches found for your criteria.`
                    : "No assets found in the marketplace."}
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Filter Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 safe-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-3">
          <div className="flex-1 overflow-x-auto no-scrollbar">
            <div className="inline-flex gap-2">
              {CATEGORIES.map((cat) => {
                const isActive = (activeCategory === cat.type) || (activeCategory === null && cat.type === null);
                return (
                  <button
                    key={cat.label}
                    onClick={() => setActiveCategory(cat.type)}
                    className={`flex flex-col items-center justify-center min-w-[72px] p-2 rounded-xl transition-all duration-200 border ${isActive
                      ? 'bg-slate-50 dark:bg-slate-800 border-slate-900/10 dark:border-white/10'
                      : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400'
                      }`}
                  >
                    <span className={`mb-1 ${isActive ? 'text-red-600 dark:text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                      {cat.icon}
                    </span>
                    <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-slate-900 dark:text-white' : ''}`}>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 px-3 border-l border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        activeCategory={activeCategory}
        initialFilters={activeFilters}
        onApplyFilters={(filters) => setActiveFilters(filters)}
        onClearFilters={() => setActiveFilters(null)}
      />
    </div>
  );
};
