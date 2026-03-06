import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ShieldCheck, Users, Fuel, Settings2, Star, MapPin, Car,
    Share2, Heart, ChevronLeft, ArrowLeft, Calendar, Gauge, Wind,
    Thermometer, Bluetooth, Map as MapIcon, Camera, Sun, Music, Wifi,
    Phone, Tv, Bed, Utensils, Cigarette, Box, Droplets, Key, Tag,
    Eye, Armchair, Check, AlertCircle, Clock, X, Award, Briefcase, Globe, Hash
} from 'lucide-react';
import { supabase } from '../supabaseClient';

// Helper component for expandable description
const DescriptionWithShowMore = ({ text }: { text: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const words = text.split(' ');
    const shouldTruncate = words.length > 100;

    const displayedText = !isExpanded && shouldTruncate
        ? words.slice(0, 100).join(' ') + '...'
        : text;

    return (
        <div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{displayedText}</p>
            {shouldTruncate && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-slate-900 dark:text-white font-semibold underline mt-2 text-sm"
                >
                    {isExpanded ? 'Show less' : 'Show more'}
                </button>
            )}
        </div>
    );
};
import { Asset, Review } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { Button } from '../components/Button';
import { AssetDetailsSkeleton } from '../components/AssetDetailsSkeleton';
import { ImageGalleryModal } from '../components/ImageGalleryModal';
import { DateRangePicker } from '../components/DateRangePicker';
import { BookingConfirmationModal } from '../components/BookingConfirmationModal';
import { HostProfileModal } from '../components/HostProfileModal';
import { ContactHostModal } from '../components/ContactHostModal';
import { LeaveReviewModal } from '../components/LeaveReviewModal';
import { useNotification } from '../contexts/NotificationContext';
import { AllReviewsModal } from '../components/AllReviewsModal';
import { getCommissionRate, RENTER_COMMISSION_SHARE } from '../utils/commission';

export const AssetDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { formatPrice } = usePreferences();
    const { openAuthModal } = useAuthModal();
    const [asset, setAsset] = useState<Asset | null>(null);
    const [ownerListings, setOwnerListings] = useState<Asset[]>([]); // New state
    const [loading, setLoading] = useState(true);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Modals
    const [isHostProfileOpen, setIsHostProfileOpen] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);

    // Booking State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pickupTime, setPickupTime] = useState('10:00');
    const [dropoffTime, setDropoffTime] = useState('10:00');
    const [pickupLocation, setPickupLocation] = useState('');
    const [dropoffLocation, setDropoffLocation] = useState('');
    const [guests, setGuests] = useState(1);

    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isMobileDatePickerOpen, setIsMobileDatePickerOpen] = useState(false);
    const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [unavailableDates, setUnavailableDates] = useState<string[]>([]);

    // Review state
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isAllReviewsModalOpen, setIsAllReviewsModalOpen] = useState(false);
    const [canReview, setCanReview] = useState(false);
    const [reviewReason, setReviewReason] = useState<string | null>(null);

    useEffect(() => {
        const checkReviewEligibility = async () => {
            if (!currentUser || !asset) return;

            if (currentUser.id === asset.owner?.id) {
                setCanReview(false);
                setReviewReason("You cannot review your own asset.");
                return;
            }

            try {
                // Check if user has already reviewed
                const { data: existingReview } = await supabase
                    .from('reviews')
                    .select('id')
                    .eq('asset_id', asset.id)
                    .eq('user_id', currentUser.id)
                    .maybeSingle();

                if (existingReview) {
                    setCanReview(false);
                    setReviewReason("You have already reviewed this asset.");
                    return;
                }

                // Check if user has a completed booking
                const { data: pastBookings } = await supabase
                    .from('bookings')
                    .select('id')
                    .eq('asset_id', asset.id)
                    .eq('client_id', currentUser.id)
                    .eq('status', 'Completed')
                    .limit(1);

                if (!pastBookings || pastBookings.length === 0) {
                    setCanReview(false);
                    setReviewReason("You can only review assets you have rented and completed a trip on.");
                    return;
                }

                setCanReview(true);
                setReviewReason(null);
            } catch (error) {
                console.error("Error checking review eligibility:", error);
                setCanReview(false);
            }
        };

        checkReviewEligibility();
    }, [currentUser, asset?.id]);

    useEffect(() => {
        // Check auth
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUser(session?.user ?? null);
            if (session?.user && id) {
                // Optionally refetch asset to check if user owns it or has verified status changes
                // fetchAsset(id);
            }
        });

        // Real-time reviews subscription
        const reviewsChannel = supabase
            .channel('public:reviews')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reviews', filter: `asset_id=eq.${id}` },
                () => {
                    fetchAsset(id);
                }
            )
            .subscribe();

        if (id) {
            fetchAsset(id);
            checkFavorite(id);
            fetchUnavailableDates(id);
        }

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(reviewsChannel);
        };
    }, [id]);

    const fetchUnavailableDates = async (assetId: string) => {
        try {
            const { data, error } = await supabase.rpc('get_asset_unavailable_dates', { p_asset_id: assetId });
            if (error) {
                console.error("Error fetching unavailable dates:", error);
                return;
            }
            if (data) {
                const blocked: string[] = [];
                data.forEach((range: any) => {
                    let current = new Date(range.start_date);
                    const end = new Date(range.end_date);
                    while (current <= end) {
                        blocked.push(current.toISOString().split('T')[0]);
                        current.setDate(current.getDate() + 1);
                    }
                });
                setUnavailableDates(blocked);
            }
        } catch (e) {
            console.error("Failed to fetch dates", e);
        }
    };

    useEffect(() => {
        if (!asset) return;

        // Update the document title
        document.title = `${asset.title} - Fleet IQ`;

        // Update meta tags for SEO and Link Previews dynamically
        const setMetaTag = (selector: string, attribute: string, val: string) => {
            // Check both property and name to avoid duplicates
            const altSelector = selector.includes('property=') ? selector.replace('property=', 'name=') : selector.replace('name=', 'property=');
            let el = document.querySelector(selector) || document.querySelector(altSelector);

            if (!el) {
                el = document.createElement('meta');

                // Determine whether to use 'name' or 'property' based on the selector
                if (selector.includes('property=')) {
                    el.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
                } else if (selector.includes('name=')) {
                    el.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
                }

                document.head.appendChild(el);
            }
            el.setAttribute(attribute, val);
        };

        // Use the asset's specific description (About this asset) for SEO
        const description = asset.description ? asset.description.substring(0, 160) + (asset.description.length > 160 ? '...' : '') : 'Premium asset rental on Fleet IQ';

        setMetaTag('meta[name="description"]', 'content', description);
        setMetaTag('meta[property="og:title"]', 'content', `${asset.title} - Fleet IQ`);
        setMetaTag('meta[property="og:description"]', 'content', description);
        setMetaTag('meta[property="og:image"]', 'content', asset.imageUrl);
        setMetaTag('meta[property="og:url"]', 'content', window.location.href);
        setMetaTag('meta[property="og:type"]', 'content', 'website');

        setMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
        setMetaTag('meta[name="twitter:title"]', 'content', `${asset.title} - Fleet IQ`);
        setMetaTag('meta[name="twitter:description"]', 'content', description);
        setMetaTag('meta[name="twitter:image"]', 'content', asset.imageUrl);

        // Cleanup function to remove asset-specific tags when unmounting
        return () => {
            document.title = 'Fleet IQ - Premium Asset Rental';
        };
    }, [asset]);

    const fetchAsset = async (assetId: string) => {
        try {
            setLoading(true);
            const { data: dbAsset, error } = await supabase
                .from('assets')
                .select('*, profiles(full_name, company_name, is_verified, is_superhost, avatar_url, created_at, bio, languages, work, fun_facts, solana_wallet_address, accepts_solana)')
                .eq('id', assetId)
                .single();

            if (error) throw error;

            if (dbAsset) {
                // Fetch reviews separately
                const { data: dbReviews, error: reviewsError } = await supabase
                    .from('reviews')
                    .select('*, profiles(full_name, avatar_url, location)')
                    .eq('asset_id', assetId)
                    .order('created_at', { ascending: false });

                // Fetch ALL assets by this owner to aggregate reviews
                const { data: ownerAssets } = await supabase
                    .from('assets')
                    .select('id')
                    .eq('owner_id', dbAsset.owner_id);

                let ownerTotalReviews = 0;
                let ownerAvgRating = 0;

                if (ownerAssets && ownerAssets.length > 0) {
                    const ownerAssetIds = ownerAssets.map(a => a.id);
                    const { data: allOwnerReviews } = await supabase
                        .from('reviews')
                        .select('rating')
                        .in('asset_id', ownerAssetIds);

                    if (allOwnerReviews && allOwnerReviews.length > 0) {
                        ownerTotalReviews = allOwnerReviews.length;
                        const sum = allOwnerReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
                        ownerAvgRating = Number((sum / ownerTotalReviews).toFixed(1));
                    }
                }

                if (reviewsError) console.error("Error fetching reviews:", reviewsError);

                const mappedReviews: Review[] = (dbReviews || []).map((r: any) => ({
                    id: r.id,
                    userId: r.user_id,
                    userName: r.profiles?.full_name || 'Anonymous',
                    userAvatar: r.profiles?.avatar_url || 'https://via.placeholder.com/150',
                    userLocation: r.profiles?.location || 'Unknown',
                    date: new Date(r.created_at).toLocaleDateString(),
                    rating: r.rating,
                    comment: r.comment,
                    cleanliness: r.cleanliness_rating,
                    accuracy: r.accuracy_rating,
                    tripExperience: r.trip_experience_rating,
                    communication: r.communication_rating,
                    value: r.value_rating
                }));

                // Calculate aggregates dynamically
                const reviewCount = mappedReviews.length;
                const calculateAvg = (key: keyof Review) => {
                    if (reviewCount === 0) return 0;
                    const sum = mappedReviews.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
                    return Number((sum / reviewCount).toFixed(1));
                };

                const overallRating = calculateAvg('rating');

                // Calculate star distribution
                const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                mappedReviews.forEach(r => {
                    const rounded = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
                    if (starCounts[rounded] !== undefined) starCounts[rounded]++;
                });

                const ratingCategories = {
                    cleanliness: calculateAvg('cleanliness'),
                    accuracy: calculateAvg('accuracy'),
                    tripExperience: calculateAvg('tripExperience'),
                    communication: calculateAvg('communication'),
                    value: calculateAvg('value')
                };

                const mappedAsset: Asset = {
                    id: dbAsset.id,
                    title: dbAsset.title,
                    type: dbAsset.type,
                    price: Number(dbAsset.price),
                    priceDuration: dbAsset.price_duration,
                    tripDuration: dbAsset.trip_duration,
                    currency: dbAsset.currency,
                    imageUrl: dbAsset.image_url,
                    gallery: [dbAsset.image_url, ...(dbAsset.gallery || []).filter((img: string) => img !== dbAsset.image_url)],
                    location: dbAsset.location,
                    country: dbAsset.country,
                    state: dbAsset.state,
                    coordinates: { lat: dbAsset.lat || 0, lng: dbAsset.lng || 0 },
                    rating: overallRating,
                    reviewCount: reviewCount,
                    isAvailable: dbAsset.is_available,
                    description: dbAsset.description,
                    features: dbAsset.features || [],
                    specs: dbAsset.specs || { capacity: 4, crewIncluded: false },
                    owner: {
                        id: dbAsset.owner_id, // Added owner_id
                        name: dbAsset.profiles?.company_name || dbAsset.profiles?.full_name || 'Host',
                        isVerified: dbAsset.profiles?.is_verified,
                        type: dbAsset.profiles?.company_name ? 'COMPANY' : 'INDIVIDUAL',
                        avatarUrl: dbAsset.profiles?.avatar_url,
                        isSuperhost: dbAsset.profiles?.is_superhost,
                        joinedDate: dbAsset.profiles?.created_at ? new Date(dbAsset.profiles.created_at).getFullYear().toString() : '2024',
                        bio: dbAsset.profiles?.bio,
                        languages: dbAsset.profiles?.languages,
                        work: dbAsset.profiles?.work,
                        funFacts: dbAsset.profiles?.fun_facts,
                        rating: ownerAvgRating, // Real owner rating
                        reviewCount: ownerTotalReviews, // Real owner review count
                        acceptsSolana: dbAsset.profiles?.accepts_solana,
                        solanaWalletAddress: dbAsset.profiles?.solana_wallet_address
                    },
                    ratingCategories: ratingCategories,
                    reviews: mappedReviews,
                    crewIds: [],
                    starCounts: starCounts, // Add to asset object
                    licensePlate: dbAsset.license_plate,
                    securityFeatures: dbAsset.security_features,
                    convoyDetails: dbAsset.convoy_details, // Map convoy details
                    documents: dbAsset.documents || { registration: '', insurance: '' } // Map documents
                };
                setAsset(mappedAsset);

                // Fetch other listings by this owner (excluding current asset)
                if (dbAsset.owner_id) {
                    const { data: listingsData } = await supabase
                        .from('assets')
                        .select('*')
                        .eq('owner_id', dbAsset.owner_id)
                        .neq('id', assetId)
                        .limit(6);

                    if (listingsData) {
                        const mappedListings = listingsData.map((a: any) => ({
                            id: a.id,
                            title: a.title,
                            type: a.type,
                            price: Number(a.price),
                            priceDuration: a.price_duration,
                            tripDuration: a.trip_duration,
                            imageUrl: a.image_url,
                            location: a.location,
                            country: a.country,
                            state: a.state,
                            rating: 0, // Simplified for brevity, or fetch if needed
                            reviewCount: 0,
                            isAvailable: a.is_available,
                            description: a.description,
                            specs: a.specs || {},
                            features: a.features || [],
                            gallery: a.gallery || [],
                            owner: mappedAsset.owner // Same owner
                        }));
                        setOwnerListings(mappedListings);
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching asset details:", err);
        } finally {
            setLoading(false);
        }
    };

    // ... existing checkFavorite ...

    const handleShare = async () => {
        if (!asset) return;
        const shareData = {
            title: asset.title,
            text: `Check out this ${asset.title} on FleetIQ!`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error("Error sharing:", err);
            }
        } else {
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                // We'd ideally need a toast here, but we can't access addToast directly if not provided to this component or via hook usage already
                // Assuming useNotification is available
                // addToast("Link Copied", "Asset link copied to clipboard!", "success"); // Uncomment if addToast is available in scope
                alert("Link copied to clipboard!");
            } catch (err) {
                console.error("Failed to copy:", err);
            }
        }
    };

    // ... existing toggleFavorite ...


    const checkFavorite = (assetId: string) => {
        try {
            const saved = localStorage.getItem('fleet-iq-favorites');
            if (saved) {
                setIsFavorite(JSON.parse(saved).includes(assetId));
            }
        } catch (e) { }
    };

    const toggleFavorite = () => {
        if (!asset) return;
        const newState = !isFavorite;
        setIsFavorite(newState);
        try {
            const saved = localStorage.getItem('fleet-iq-favorites');
            let favorites: string[] = saved ? JSON.parse(saved) : [];
            if (newState) {
                if (!favorites.includes(asset.id)) favorites.push(asset.id);
            } else {
                favorites = favorites.filter(id => id !== asset.id);
            }
            localStorage.setItem('fleet-iq-favorites', JSON.stringify(favorites));
        } catch (e) { }
    };

    const calculateDays = () => {
        if (!startDate) return 0;
        if (!endDate) return 1;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays === 0 ? 1 : diffDays;
    };

    const getFeatureIcon = (feature: string) => {
        const lower = feature.toLowerCase();
        const iconClass = "w-5 h-5 text-slate-400 mr-3";

        if (lower.includes('air cond') || lower.includes('ac') || lower.includes('climate')) return <Wind className={iconClass} />;
        if (lower.includes('heater') || lower.includes('heat')) return <Thermometer className={iconClass} />;
        if (lower.includes('bluetooth')) return <Bluetooth className={iconClass} />;
        if (lower.includes('nav') || lower.includes('gps')) return <MapIcon className={iconClass} />;
        if (lower.includes('camera')) return <Camera className={iconClass} />;
        if (lower.includes('sunroof')) return <Sun className={iconClass} />;
        if (lower.includes('sound') || lower.includes('speaker') || lower.includes('audio')) return <Music className={iconClass} />;
        if (lower.includes('wifi') || lower.includes('wi-fi')) return <Wifi className={iconClass} />;
        if (lower.includes('phone')) return <Phone className={iconClass} />;
        if (lower.includes('tv') || lower.includes('screen') || lower.includes('entertainment')) return <Tv className={iconClass} />;
        if (lower.includes('bed') || lower.includes('sleep') || lower.includes('suite')) return <Bed className={iconClass} />;
        if (lower.includes('kitchen') || lower.includes('galley')) return <Utensils className={iconClass} />;
        if (lower.includes('smoking')) return <Cigarette className={iconClass} />;
        if (lower.includes('cargo') || lower.includes('basket')) return <Box className={iconClass} />;
        if (lower.includes('water') || lower.includes('jacuzzi')) return <Droplets className={iconClass} />;
        if (lower.includes('blind spot') || lower.includes('vision')) return <Eye className={iconClass} />;
        if (lower.includes('seat') || lower.includes('leather')) return <Armchair className={iconClass} />;

        return <Check className={iconClass} />;
    };

    if (loading) return <AssetDetailsSkeleton />;
    if (!asset) return <div className="text-center py-20 text-slate-500">Asset not found or unavailable.</div>;

    const days = calculateDays();
    const baseTripPrice = asset.price * days;
    const totalCommission = baseTripPrice * getCommissionRate(asset.type);
    const serviceFee = totalCommission * RENTER_COMMISSION_SHARE; // Renter pays 20% of total commission
    const totalPrice = baseTripPrice + serviceFee;

    const isGuestFavorite = asset && (asset.reviewCount || 0) >= 5 && asset.rating >= 4.8;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pb-24 lg:pb-20">

            {/* Mobile Image Gallery (Carousel) */}
            <div className="md:hidden relative h-96 bg-slate-200 group">
                {/* Carousel Container */}
                <div
                    className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full w-full"
                    onScroll={(e) => {
                        const scrollLeft = e.currentTarget.scrollLeft;
                        const width = e.currentTarget.offsetWidth;
                        const newIndex = Math.round(scrollLeft / width);
                        if (newIndex !== galleryIndex) setGalleryIndex(newIndex);
                    }}
                >
                    {asset.gallery.map((img, idx) => (
                        <div key={idx} className="w-full h-full snap-center flex-shrink-0 cursor-pointer relative" onClick={() => { setIsGalleryOpen(true); setGalleryIndex(idx); }}>
                            <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>

                {/* Header Actions Overlay */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                    {/* Back Button */}
                    <button onClick={() => navigate(-1)} className="pointer-events-auto p-2 bg-white rounded-full shadow-md text-slate-900 transition-transform hover:scale-105 active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    {/* Right Actions */}
                    <div className="flex gap-3 pointer-events-auto">
                        <button onClick={handleShare} className="p-2 bg-white rounded-full shadow-md text-slate-900 transition-transform hover:scale-105 active:scale-95">
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button onClick={toggleFavorite} className="p-2 bg-white rounded-full shadow-md transition-transform hover:scale-105 active:scale-95">
                            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-900'}`} />
                        </button>
                    </div>
                </div>

                {/* Image Counter Badge */}
                <div className="absolute bottom-10 right-4 bg-black/50 backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded-md pointer-events-none">
                    {galleryIndex + 1} / {asset.gallery.length}
                </div>
            </div>

            {/* Desktop Image Grid */}
            <div className="hidden md:block max-w-7xl mx-auto px-8 pt-6 pb-8">
                <div className="flex justify-between items-start mb-6">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors mb-2">
                        <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        <span className="text-sm font-medium underline decoration-slate-300 dark:text-white">Back</span>
                    </button>
                    <div className="flex gap-2">
                        <button onClick={toggleFavorite} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-600 dark:text-slate-300'}`} />
                            <span className="text-sm font-medium underline decoration-slate-300 dark:text-white">Save</span>
                        </button>
                        <button onClick={handleShare} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                            <Share2 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            <span className="text-sm font-medium underline decoration-slate-300 dark:text-white">Share</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-4 grid-rows-2 gap-3 h-[400px] rounded-2xl overflow-hidden relative group">
                    <div className="col-span-2 row-span-2 cursor-pointer" onClick={() => { setIsGalleryOpen(true); setGalleryIndex(0); }}>
                        <img src={asset.imageUrl} alt={asset.title} className="w-full h-full object-cover hover:opacity-95 transition-opacity" />
                    </div>
                    {asset.gallery.slice(1, 5).map((img, idx) => (
                        <div key={idx} className="cursor-pointer" onClick={() => { setIsGalleryOpen(true); setGalleryIndex(idx + 1); }}>
                            <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover hover:opacity-95 transition-opacity" />
                        </div>
                    ))}
                    <button
                        onClick={() => setIsGalleryOpen(true)}
                        className="absolute bottom-4 right-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2 rounded-lg shadow-md text-sm font-semibold hover:scale-105 transition-transform"
                    >
                        Show all photos
                    </button>
                </div>
            </div>

            {/* Main Content Wrapper with Rounded Corners for Mobile overlap */}
            <div className="-mt-4 relative z-10 bg-white dark:bg-slate-950 rounded-t-[24px] pt-8 md:mt-0 md:bg-transparent md:rounded-none md:pt-0">
                <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-6 text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">{asset.title}</h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-3 text-sm text-slate-500 dark:text-slate-400">
                                <span className="flex items-center">
                                    <Star className="w-4 h-4 fill-slate-900 dark:fill-white text-slate-900 dark:text-white mr-1.5" />
                                    <span className="font-medium text-slate-900 dark:text-white">{asset.rating}</span>
                                </span>
                                <span className="mx-2 md:mx-3">·</span>
                                <span
                                    className="underline cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                                    onClick={() => setIsAllReviewsModalOpen(true)}
                                >
                                    {asset.reviewCount} reviews
                                </span>
                                {isGuestFavorite && (
                                    <>
                                        <span className="mx-2 md:mx-3 hidden sm:inline">·</span>
                                        <div className="px-2.5 py-1 bg-gradient-to-r from-red-600 to-amber-500 rounded-full flex items-center shadow-sm whitespace-nowrap ml-2 sm:ml-0">
                                            <Award className="w-3 h-3 text-white mr-1" />
                                            <span className="text-[10px] font-bold text-white tracking-wide uppercase leading-tight">Renter's Favorite</span>
                                        </div>
                                    </>
                                )}
                                <span className="mx-2 md:mx-3">·</span>
                                <span className="font-medium text-slate-900 dark:text-white underline cursor-pointer truncate max-w-[200px] sm:max-w-none">{asset.location}</span>
                            </div>
                        </div>

                        {/* Badges/Specs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4 transition-all hover:shadow-md cursor-default">
                                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg shrink-0 shadow-sm">
                                    <ShieldCheck className="w-5 h-5 text-slate-900 dark:text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Verified Asset</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">Inspected</p>
                                </div>
                            </div>

                            {asset.specs.crewIncluded && (
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4 transition-all hover:shadow-md cursor-default">
                                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg shrink-0 shadow-sm">
                                        <Users className="w-5 h-5 text-slate-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Expert Crew Included</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed">Included</p>
                                    </div>
                                </div>
                            )}

                            {asset.specs.fuelType && (
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4 transition-all hover:shadow-md cursor-default">
                                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg shrink-0 shadow-sm">
                                        <Fuel className="w-5 h-5 text-slate-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Fuel Type</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{asset.specs.fuelType}</p>
                                    </div>
                                </div>
                            )}

                            {asset.specs.transmission && (
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4 transition-all hover:shadow-md cursor-default">
                                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg shrink-0 shadow-sm">
                                        <Settings2 className="w-5 h-5 text-slate-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Transmission</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{asset.specs.transmission}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Security Features (Convoy) */}
                        {asset.type === 'Convoy' && asset.securityFeatures?.included && (
                            <div className="bg-slate-900 text-white p-6 rounded-2xl mb-8 border border-slate-800 shadow-xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <ShieldCheck className="w-6 h-6 text-green-500" />
                                    <h3 className="text-lg font-bold">Security Detail Included</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Personnel</p>
                                        <p className="font-medium text-lg">{asset.securityFeatures.count} Officers</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Type</p>
                                        <p className="font-medium text-lg">{asset.securityFeatures.type}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Status</p>
                                        <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${asset.securityFeatures.armed ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-slate-700 text-slate-300'}`}>
                                            {asset.securityFeatures.armed ? 'ARMED' : 'UNARMED'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Convoy Vehicles List */}
                        {asset.type === 'Convoy' && asset.convoyDetails && asset.convoyDetails.length > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl mb-8 border border-slate-200 dark:border-slate-800">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Convoy Vehicles</h3>
                                <div className="space-y-3">
                                    {asset.convoyDetails.map((vehicle, index) => (
                                        <div key={index} className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                                    <Car className="w-5 h-5 text-slate-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{vehicle.make} {vehicle.model}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{vehicle.licensePlate}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">About this Asset</h2>
                            <DescriptionWithShowMore text={asset.description} />
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Asset Feature</h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                {asset.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center text-slate-600 dark:text-slate-300">
                                        {getFeatureIcon(feature)}
                                        <span className="text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar (Booking Widget) */}
                    <div className="hidden lg:block lg:col-span-1 relative">
                        <div className="sticky top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatPrice(asset.price)}</span>
                                    <span className="text-slate-500 dark:text-slate-400 text-sm"> / {asset.priceDuration === 'Custom' ? `${asset.tripDuration}h` : asset.priceDuration}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Star className="w-4 h-4 text-slate-900 dark:text-white fill-slate-900 dark:fill-white mr-1" />
                                    <span className="font-medium text-slate-900 dark:text-white">{asset.rating}</span>
                                </div>
                            </div>

                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl mb-4 relative bg-white dark:bg-slate-900">
                                {/* Row 1: Dates */}
                                <div
                                    className="border-b border-slate-200 dark:border-slate-700 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-t-xl"
                                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                >
                                    <label className="block text-[10px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1 pointer-events-none">Trip Dates</label>
                                    <div className={`text-sm ${startDate ? 'text-slate-900 dark:text-white' : 'text-slate-400'} pointer-events-none`}>
                                        {startDate ? `${startDate} ${endDate ? '– ' + endDate : ''}` : 'Add dates'}
                                    </div>
                                </div>

                                {/* Row 2: Times */}
                                <div className="flex border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex-1 p-3 border-r border-slate-200 dark:border-slate-700">
                                        <label className="block text-[10px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Pickup Time</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                value={pickupTime}
                                                onChange={(e) => setPickupTime(e.target.value)}
                                                className="w-full bg-transparent text-sm text-slate-900 dark:text-white outline-none p-0 border-0 focus:ring-0 dark:[color-scheme:dark] min-h-[24px]"
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 p-3">
                                        <label className="block text-[10px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Dropoff Time</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                value={dropoffTime}
                                                onChange={(e) => setDropoffTime(e.target.value)}
                                                className="w-full bg-transparent text-sm text-slate-900 dark:text-white outline-none p-0 border-0 focus:ring-0 dark:[color-scheme:dark] min-h-[24px]"
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Row 3: Pickup Location */}
                                <div className="border-b border-slate-200 dark:border-slate-700 p-3">
                                    <input
                                        type="text"
                                        placeholder="Pickup Location"
                                        value={pickupLocation}
                                        onChange={(e) => setPickupLocation(e.target.value)}
                                        className="w-full bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder-slate-400"
                                    />
                                </div>

                                {/* Row 4: Dropoff Location */}
                                <div className="border-b border-slate-200 dark:border-slate-700 p-3">
                                    <input
                                        type="text"
                                        placeholder="Drop-off Location"
                                        value={dropoffLocation}
                                        onChange={(e) => setDropoffLocation(e.target.value)}
                                        className="w-full bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder-slate-400"
                                    />
                                </div>

                                {/* Row 5: Guests */}
                                <div className="p-3 rounded-b-xl">
                                    <label className="block text-[10px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Guests</label>
                                    <select
                                        className="w-full bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none p-0 border-0 focus:ring-0 cursor-pointer"
                                        value={guests}
                                        onChange={(e) => setGuests(Number(e.target.value))}
                                    >
                                        <option value={1}>1 Guest</option>
                                        <option value={2}>2 Guests</option>
                                        {[...Array(Math.max(0, asset.specs.capacity - 2))].map((_, i) => (
                                            <option key={i + 3} value={i + 3}>{i + 3} Guests</option>
                                        ))}
                                    </select>
                                </div>

                                <DateRangePicker
                                    isOpen={isDatePickerOpen}
                                    onClose={() => setIsDatePickerOpen(false)}
                                    startDate={startDate}
                                    endDate={endDate}
                                    onDatesChange={(s, e) => { setStartDate(s); setEndDate(e); }}
                                    blockedDates={unavailableDates}
                                />
                            </div>

                            <Button
                                fullWidth
                                size="lg"
                                className="mb-4 text-white hover:opacity-90 transition-colors"
                                onClick={() => startDate ? setIsConfirmationOpen(true) : setIsDatePickerOpen(true)}
                            >
                                {startDate ? 'Rent' : 'Check availability'}
                            </Button>

                            {!startDate && (
                                <div className="flex justify-center items-center gap-2 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-xs">
                                    <AlertCircle className="w-3 h-3" />
                                    Enter dates to see total pricing.
                                </div>
                            )}

                            {startDate && (
                                <div className="space-y-3 mt-4">
                                    <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm">
                                        <span className="underline decoration-slate-300">Base trip price</span>
                                        <span>{formatPrice(asset.price)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm">
                                        <span className="underline decoration-slate-300">FleetIQ service fee</span>
                                        <span>{formatPrice(serviceFee)}</span>
                                    </div>
                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-between font-bold text-slate-900 dark:text-white text-base">
                                        <span>Total</span>
                                        <span>{formatPrice(totalPrice)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Bottom Full-Width Sections */}
                {/* Bottom Full-Width Sections */}
                <div className="space-y-16 pb-16">
                    {/* Reviews Section */}
                    <div className="mt-16 border-t border-slate-100 dark:border-slate-800 pt-16">
                        <div className="max-w-7xl mx-auto px-4 md:px-8">
                            <div className="flex items-center gap-2 mb-8">
                                <Star className="w-5 h-5 fill-slate-900 dark:fill-white text-slate-900 dark:text-white" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{asset.rating} · {asset.reviewCount} reviews</h2>
                            </div>

                            {/* Rating Categories Summary */}
                            <div className="mb-12 overflow-x-auto no-scrollbar pb-4 md:pb-0">
                                <div className="flex md:grid md:grid-cols-6 gap-8 min-w-max md:min-w-0">
                                    <div className="pr-8 border-r border-slate-100 dark:border-slate-800">
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Overall rating</p>
                                        <div className="space-y-1">
                                            {[5, 4, 3, 2, 1].map((level) => {
                                                const count = asset.starCounts ? asset.starCounts[level as 1 | 2 | 3 | 4 | 5] : 0;
                                                const total = asset.reviewCount || 1; // Prevent division by zero
                                                const percentage = Math.round((count / total) * 100);

                                                return (
                                                    <div key={level} className="flex items-center gap-2 text-[10px] text-slate-400">
                                                        <span>{level}</span>
                                                        <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-24">
                                                            <div className="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {[
                                        { label: 'Cleanliness', score: asset.ratingCategories.cleanliness, icon: <Droplets className="w-6 h-6" /> },
                                        { label: 'Accuracy', score: asset.ratingCategories.accuracy, icon: <Check className="w-6 h-6" /> },
                                        { label: 'Trip experience', score: asset.ratingCategories.tripExperience, icon: <Key className="w-6 h-6" /> },
                                        { label: 'Communication', score: asset.ratingCategories.communication, icon: <Music className="w-6 h-6" /> },
                                        { label: 'Value', score: asset.ratingCategories.value, icon: <Tag className="w-6 h-6" /> }
                                    ].map((cat, i) => (
                                        <div key={i} className={`flex flex-col gap-4 ${i < 4 ? 'md:pr-8 md:border-r md:border-slate-100 dark:md:border-slate-800' : ''}`}>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{cat.label}</p>
                                                <p className="text-lg font-bold text-slate-900 dark:text-white">{cat.score.toFixed(1)}</p>
                                            </div>
                                            <div className="text-slate-900 dark:text-white">{cat.icon}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reviews List */}
                            <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar -mx-4 px-4 md:grid md:grid-cols-2 md:grid-flow-row md:overflow-visible md:gap-8 md:px-0 md:mx-0 mb-10">
                                {asset.reviews && asset.reviews.length > 0 ? (
                                    asset.reviews.slice(0, 6).map((review) => (
                                        <div key={review.id} className="snap-start shrink-0 min-w-[85vw] w-[85vw] md:min-w-0 md:w-auto p-6 rounded-2xl border border-slate-200 dark:border-slate-800 md:p-0 md:border-none md:rounded-none space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                                    <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white">{review.userName}</h4>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center">{review.userLocation} · {review.date}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-slate-900 dark:fill-white text-slate-900 dark:text-white' : 'text-slate-200 dark:text-slate-700'}`} />
                                                ))}
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">{review.comment}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 text-slate-500 italic">No reviews yet.</div>
                                )}
                            </div>

                            {asset.reviews && asset.reviews.length > 6 && (
                                <div className="mb-10 w-full md:w-auto max-w-[400px]">
                                    <button
                                        onClick={() => setIsAllReviewsModalOpen(true)}
                                        className="w-full md:w-auto px-8 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Show all {asset.reviews.length} reviews
                                    </button>
                                </div>
                            )}

                            {/* Review Action Card */}
                            <div className="mb-10 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col items-center text-center">
                                {!currentUser ? (
                                    <>
                                        <div className="font-bold text-slate-900 dark:text-white mb-2">Have you rented this fleet?</div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Sign in to share your experience regarding the fleet and owner.</p>
                                        <Button onClick={() => openAuthModal('login')}>Log in to Review</Button>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Rate your experience</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                                            Share your feedback about the <strong>{asset.title}</strong> and the host <strong>{asset.owner.name}</strong> to help others make better decisions.
                                        </p>
                                        {canReview ? (
                                            <Button onClick={() => setIsReviewModalOpen(true)}>Write a Review</Button>
                                        ) : (
                                            <div className="text-sm text-amber-600 dark:text-amber-500 font-medium bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg leading-relaxed">
                                                {reviewReason || "Checking eligibility..."}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Host Section - Refactored */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-16">
                        <div className="max-w-7xl mx-auto px-4 md:px-8">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Meet fleet owner</h2>

                            <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                                {/* Left: Profile Card */}
                                <div className="w-full md:w-1/3 lg:w-1/4">
                                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                                        <div className="relative mb-4">
                                            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                                {asset.owner.avatarUrl ? (
                                                    <img src={asset.owner.avatarUrl} alt={asset.owner.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-400">{asset.owner.name.charAt(0)}</div>
                                                )}
                                            </div>
                                            {asset.owner.isVerified && (
                                                <div className="absolute bottom-0 right-0 bg-[#E91E63] text-white p-1.5 rounded-full border-[3px] border-white dark:border-slate-900">
                                                    <ShieldCheck className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{asset.owner.name}</h3>
                                        {asset.owner.isSuperhost && (
                                            <div className="flex items-center gap-1 text-sm font-medium text-slate-900 dark:text-white mb-4">
                                                <Award className="w-4 h-4" />
                                                <span>Superhost</span>
                                            </div>
                                        )}

                                        <div className="w-full space-y-4 mb-6">
                                            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                                                <span className="text-sm text-slate-500 dark:text-slate-400">Reviews</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{asset.owner.reviewCount}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                                                <span className="text-sm text-slate-500 dark:text-slate-400">Rating</span>
                                                <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                                                    <span>{asset.owner.rating}</span>
                                                    <Star className="w-3 h-3 fill-slate-900 dark:fill-white" />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-sm text-slate-500 dark:text-slate-400">Years hosting</span>
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {new Date().getFullYear() - Number(asset.owner.joinedDate) || 1}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full space-y-3">
                                            <Button fullWidth className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100" onClick={() => setIsHostProfileOpen(true)}>View Full Profile</Button>
                                            <Button fullWidth variant="outline" onClick={(e) => { e.stopPropagation(); setIsContactOpen(true); }}>Contact Fleet Owner</Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: About */}
                                <div className="w-full md:w-2/3 lg:w-3/4">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">About {asset.owner.name}</h3>
                                    <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                                        <p>{asset.owner.bio || `Hi, I'm ${asset.owner.name}. I'm passionate about providing the best fleet experiences. Check out my listings and feel free to reach out!`}</p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-start gap-3">
                                            <Briefcase className="w-5 h-5 mt-1 text-slate-900 dark:text-white" />
                                            <div>
                                                <span className="block font-medium text-slate-900 dark:text-white">My work</span>
                                                <span className="text-sm text-slate-500 dark:text-slate-400">{asset.owner.work || 'Fleet Manager & Entrepreneur'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Globe className="w-5 h-5 mt-1 text-slate-900 dark:text-white" />
                                            <div>
                                                <span className="block font-medium text-slate-900 dark:text-white">Languages</span>
                                                <span className="text-sm text-slate-500 dark:text-slate-400">{asset.owner.languages?.join(', ') || 'English'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {/* Fixed Elements outside Wrapper */}
            < div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 safe-bottom z-40" >
                <div className="flex justify-between items-center gap-4">
                    <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{formatPrice(asset.price)}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{startDate ? 'Total' : 'per trip'}</span>
                    </div>
                    <Button onClick={() => setIsMobileFormOpen(true)}>Check availability</Button>
                </div>
            </div >

            <div className={`fixed inset-0 z-50 flex items-end lg:hidden pointer-events-none transition-all ${isMobileFormOpen ? 'visible' : 'invisible'}`}>
                <div className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isMobileFormOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileFormOpen(false)} />
                <div className={`w-full bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl transform transition-transform duration-300 pointer-events-auto max-h-[85vh] flex flex-col ${isMobileFormOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-lg text-slate-900 dark:text-white">Booking Details</span>
                        <button onClick={() => setIsMobileFormOpen(false)} className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-4 overflow-y-auto space-y-4">
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden relative">
                            <div className="border-b border-slate-200 dark:border-slate-700 p-3" onClick={() => setIsMobileDatePickerOpen(!isMobileDatePickerOpen)}>
                                <label className="block text-[10px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Trip Dates</label>
                                <div className={`text-sm ${startDate ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{startDate ? `${startDate} ${endDate ? '– ' + endDate : ''}` : 'Add dates'}</div>
                            </div>
                            <div className="flex border-b border-slate-200 dark:border-slate-700">
                                <div className="flex-1 p-3 border-r border-slate-200 dark:border-slate-700">
                                    <label className="block text-[10px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Pickup Time</label>
                                    <input
                                        type="time"
                                        value={pickupTime}
                                        onChange={(e) => setPickupTime(e.target.value)}
                                        className="w-full bg-transparent text-sm text-slate-900 dark:text-white outline-none dark:[color-scheme:dark]"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                                <div className="flex-1 p-3">
                                    <label className="block text-[10px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Dropoff Time</label>
                                    <input
                                        type="time"
                                        value={dropoffTime}
                                        onChange={(e) => setDropoffTime(e.target.value)}
                                        className="w-full bg-transparent text-sm text-slate-900 dark:text-white outline-none dark:[color-scheme:dark]"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>
                            <div className="border-b border-slate-200 dark:border-slate-700 p-3"><input type="text" placeholder="Pickup Location" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className="w-full bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder-slate-400" /></div>
                            <div className="border-b border-slate-200 dark:border-slate-700 p-3"><input type="text" placeholder="Drop-off Location" value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} className="w-full bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder-slate-400" /></div>
                            <div className="p-3">
                                <label className="block text-[10px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Guests</label>
                                <select className="w-full bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                                    <option value={1}>1 Guest</option>
                                    <option value={2}>2 Guests</option>
                                    {[...Array(Math.max(0, asset.specs.capacity - 2))].map((_, i) => (<option key={i + 3} value={i + 3}>{i + 3} Guests</option>))}
                                </select>
                            </div>
                            <DateRangePicker isOpen={isMobileDatePickerOpen} onClose={() => setIsMobileDatePickerOpen(false)} startDate={startDate} endDate={endDate} onDatesChange={(s, e) => { setStartDate(s); setEndDate(e); }} className="!fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !w-[90%] max-w-sm shadow-2xl z-[60]" />
                        </div>
                        {startDate && (
                            <div className="space-y-3">
                                <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm"><span className="underline decoration-slate-300">Base trip price</span><span>{formatPrice(asset.price)}</span></div>
                                <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm"><span className="underline decoration-slate-300">FleetIQ service fee</span><span>{formatPrice(serviceFee)}</span></div>
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-between font-bold text-slate-900 dark:text-white text-base"><span>Total</span><span>{formatPrice(totalPrice)}</span></div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                        <Button
                            fullWidth
                            size="lg"
                            className="text-white hover:opacity-90"
                            onClick={() => { if (startDate) { setIsMobileFormOpen(false); setIsConfirmationOpen(true); } else { setIsMobileDatePickerOpen(true); } }}
                        >
                            {startDate ? 'Rent' : 'Select Dates'}
                        </Button>
                    </div>
                </div>
            </div>

            <ImageGalleryModal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} images={asset.gallery} initialIndex={galleryIndex} />
            <HostProfileModal isOpen={isHostProfileOpen} onClose={() => setIsHostProfileOpen(false)} owner={asset.owner} listings={ownerListings} />
            <ContactHostModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} hostId={asset.owner.id} hostName={asset.owner.name} assetId={asset.id} assetTitle={asset.title} />
            <LeaveReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                assetId={asset.id}
                assetTitle={asset.title}
                hostName={asset.owner.name}
                onReviewSubmitted={() => fetchAsset(asset.id)}
            />
            <BookingConfirmationModal
                isOpen={isConfirmationOpen}
                onClose={() => setIsConfirmationOpen(false)}
                onConfirm={() => { alert('Booking Confirmed! (Mock)'); setIsConfirmationOpen(false); }}
                asset={asset}
                startDate={startDate}
                endDate={endDate || startDate}
                pickupTime={pickupTime}
                dropoffTime={dropoffTime}
                pickupLocation={pickupLocation}
                dropoffLocation={dropoffLocation}
                guests={guests}
                totalPrice={totalPrice}
                serviceFee={serviceFee}
                days={days}
            />

            {asset && (
                <AllReviewsModal
                    isOpen={isAllReviewsModalOpen}
                    onClose={() => setIsAllReviewsModalOpen(false)}
                    asset={asset}
                    isGuestFavorite={isGuestFavorite}
                />
            )}
        </div >
    );
};
