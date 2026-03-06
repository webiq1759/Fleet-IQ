
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Asset } from '../types';
import { MapPin, Star, Shield, Search, ArrowRight, ShieldCheck, Users, Gauge, Fuel, Settings2, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/Button';
import { AssetCard } from '../components/AssetCard';
import { AssetListCard } from '../components/AssetListCard';
import { AssetCardSkeleton } from '../components/AssetCardSkeleton';
import { usePreferences } from '../contexts/PreferencesContext';

export const PublicBookingPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const { formatPrice } = usePreferences();
    const [partner, setPartner] = useState<any>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -340 : 340;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const fetchPartnerData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const nameQuery = slug?.replace(/-/g, ' ') || '';

                // 1. Fetch Partner
                const { data: profiles, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .or(`company_name.ilike.%${nameQuery}%,full_name.ilike.%${nameQuery}%`)
                    .eq('role', 'LISTER')
                    .limit(1);

                if (profileError) throw profileError;
                if (!profiles || profiles.length === 0) {
                    setError('Partner not found');
                    return;
                }

                const partnerProfile = profiles[0];
                setPartner(partnerProfile);

                // 2. Fetch Assets
                const { data: assetsData, error: assetsError } = await supabase
                    .from('assets')
                    .select('*')
                    .eq('owner_id', partnerProfile.id)
                    .eq('status', 'Approved');

                if (assetsError) throw assetsError;

                // 3. Fetch Reviews for these assets to ensure accurate counts
                const assetIds = (assetsData || []).map((a: any) => a.id);
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

                // Map Assets
                const mappedAssets: Asset[] = (assetsData || []).map((dbAsset: any) => {
                    const realReviews = reviewsMap[dbAsset.id] || { count: 0, totalRating: 0 };
                    // Prefer calculated reviews if available, otherwise fallback to DB count which might be stale
                    const reviewCount = realReviews.count > 0 ? realReviews.count : (Number(dbAsset.review_count) || 0);
                    const avgRating = realReviews.count > 0 ? (realReviews.totalRating / realReviews.count) : (Number(dbAsset.rating) || 0);

                    return {
                        id: dbAsset.id,
                        title: dbAsset.title,
                        type: dbAsset.type,
                        price: Number(dbAsset.price),
                        priceDuration: dbAsset.price_duration,
                        tripDuration: dbAsset.trip_duration,
                        currency: dbAsset.currency,
                        imageUrl: dbAsset.image_url,
                        gallery: dbAsset.gallery || [],
                        location: dbAsset.location,
                        country: dbAsset.country,
                        state: dbAsset.state,
                        coordinates: dbAsset.coordinates || { lat: 0, lng: 0 },
                        rating: avgRating,
                        reviewCount: reviewCount,
                        isAvailable: dbAsset.is_available,
                        description: dbAsset.description,
                        features: dbAsset.features || [],
                        specs: dbAsset.specs || {},
                        owner: {
                            id: partnerProfile.id,
                            name: partnerProfile.company_name || partnerProfile.full_name,
                            isVerified: partnerProfile.is_verified,
                            type: partnerProfile.role === 'LISTER' ? 'COMPANY' : 'INDIVIDUAL',
                            avatarUrl: partnerProfile.avatar_url,
                            isSuperhost: partnerProfile.is_superhost,
                            joinedDate: new Date(partnerProfile.created_at).getFullYear().toString()
                        },
                        licensePlate: dbAsset.license_plate,
                        documents: dbAsset.documents || { registration: '', insurance: '' },
                        ratingCategories: { cleanliness: 5, accuracy: 5, tripExperience: 5, communication: 5, location: 5, value: 5 },
                        reviews: []
                    };
                });

                setAssets(mappedAssets);

            } catch (err: any) {
                console.error('Error fetching public booking page:', err);
                setError('Failed to load partner page');
            } finally {
                setIsLoading(false);
            }
        };

        if (slug) {
            fetchPartnerData();
        }
    }, [slug]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
                {/* Skeleton Header */}
                <div className="relative py-20 px-4 overflow-hidden bg-slate-900">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
                        <div className="w-32 h-32 rounded-3xl bg-slate-800 animate-pulse"></div>
                        <div className="flex-1 space-y-4 w-full md:max-w-xl">
                            <div className="h-10 bg-slate-800 rounded w-3/4 mx-auto md:mx-0 animate-pulse"></div>
                            <div className="flex gap-4 justify-center md:justify-start">
                                <div className="h-6 w-24 bg-slate-800 rounded animate-pulse"></div>
                                <div className="h-6 w-24 bg-slate-800 rounded animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Skeleton Grid */}
                <div className="max-w-7xl mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <AssetCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !partner) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Partner Not Found</h1>
                <p className="text-slate-500 mb-6">The fleet partner page you are looking for does not exist.</p>
                <Button onClick={() => window.location.href = '/'}>Go to Marketplace</Button>
            </div>
        );
    }

    const displayName = partner.company_name || partner.full_name;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header / Cover with Animated Gradient */}
            <div className="relative py-10 md:py-14 px-4 overflow-hidden bg-slate-950">
                {/* Animated Gradient Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 -left-4 w-64 h-64 md:w-96 md:h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-64 h-64 md:w-96 md:h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-64 h-64 md:w-96 md:h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px]"></div>
                </div>

                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
                        {/* Avatar Column */}
                        <div className="shrink-0 relative">
                            <div className="w-24 h-24 md:w-36 md:h-36 rounded-2xl md:rounded-3xl bg-white/10 flex items-center justify-center overflow-hidden border-2 md:border-4 border-white/20 shadow-2xl backdrop-blur-md">
                                {partner.avatar_url ? (
                                    <img src={partner.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl md:text-5xl font-bold text-white/40">{displayName.charAt(0)}</span>
                                )}
                            </div>
                            {partner.is_superhost && (
                                <div className="absolute -bottom-2 -right-2 md:-bottom-3 md:-right-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold shadow-lg border border-white/20 flex items-center gap-1">
                                    <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-white" />
                                    Superhost
                                </div>
                            )}
                        </div>

                        {/* Info Column */}
                        <div className="flex-1 text-center md:text-left text-white w-full">
                            <h1 className="text-3xl md:text-5xl font-bold mb-3 tracking-tight">{displayName}</h1>

                            {/* Badges Row */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 mb-6">
                                {partner.location && (
                                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors">
                                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                                        <span className="font-medium text-xs md:text-sm">{partner.location}</span>
                                    </div>
                                )}
                                {partner.is_verified && (
                                    <div className="flex items-center gap-1.5 bg-emerald-500/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-emerald-500/30 text-emerald-300">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        <span className="font-medium text-xs md:text-sm">Verified Partner</span>
                                    </div>
                                )}
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6 border-y border-white/10 py-4">
                                <div className="text-center md:text-left">
                                    <div className="text-2xl md:text-3xl font-bold mb-0.5">{assets.length}</div>
                                    <div className="text-[10px] md:text-xs uppercase tracking-wider text-slate-400 font-semibold">Listings</div>
                                </div>
                                <div className="text-center md:text-left">
                                    <div className="text-2xl md:text-3xl font-bold mb-0.5">
                                        {assets.reduce((acc, curr) => acc + (curr.reviewCount || 0), 0)}
                                    </div>
                                    <div className="text-[10px] md:text-xs uppercase tracking-wider text-slate-400 font-semibold">Reviews</div>
                                </div>
                                {partner.languages && partner.languages.length > 0 && (
                                    <div className="col-span-1 md:col-span-2 text-center md:text-left">
                                        <div className="text-sm md:text-lg font-bold mb-0.5 line-clamp-1">{partner.languages.slice(0, 2).join(', ')}{partner.languages.length > 2 ? ' +' : ''}</div>
                                        <div className="text-[10px] md:text-xs uppercase tracking-wider text-slate-400 font-semibold">Languages</div>
                                    </div>
                                )}
                            </div>

                            {/* Bio */}
                            {partner.bio && (
                                <p className="text-sm md:text-lg text-slate-300 leading-relaxed font-light max-w-3xl mx-auto md:mx-0">
                                    "{partner.bio}"
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Assets Grid */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Available Fleet</h2>
                        <p className="text-slate-500 mt-1">Select a vehicle to view details and book. {assets.length > 0 && `${assets.length} available`}</p>
                    </div>
                    {/* View Toggle and Controls */}
                    <div className="flex items-center gap-4">
                        {viewMode === 'list' && assets.length > 0 && (
                            <div className="hidden md:flex gap-2">
                                <button onClick={() => scroll('left')} className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                </button>
                                <button onClick={() => scroll('right')} className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                </button>
                            </div>
                        )}
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                            >
                                <LayoutGrid className="w-5 h-5 sm:w-4 sm:h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                            >
                                <List className="w-5 h-5 sm:w-4 sm:h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {assets.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No assets found</h3>
                        <p className="text-slate-500 mt-1 max-w-sm mx-auto">This partner doesn't have any assets available for booking right now.</p>
                    </div>
                ) : (
                    <div ref={scrollRef} className={viewMode === 'list' ? "flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"}>
                        {assets.map(asset => (
                            viewMode === 'list' ? (
                                <div key={asset.id} className="snap-start shrink-0 min-w-[85vw] w-[85vw] md:min-w-[48%] md:w-[48%] lg:min-w-[480px] lg:w-[480px] xl:min-w-[550px] xl:w-[550px]">
                                    <AssetListCard asset={asset} />
                                </div>
                            ) : (
                                <div key={asset.id} className="h-full">
                                    <AssetCard asset={asset} />
                                </div>
                            )
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
};
