
import React, { useEffect, useState } from 'react';
import { X, Heart, Star, MapPin, ChevronRight, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Asset } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';

interface SavedAssetsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SavedAssetsModal: React.FC<SavedAssetsModalProps> = ({ isOpen, onClose }) => {
    const [savedAssets, setSavedAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const { formatPrice } = usePreferences();
    const navigate = useNavigate();

    // Fetch saved assets whenever modal opens
    useEffect(() => {
        if (isOpen) {
            fetchSavedAssets();
        }
    }, [isOpen]);

    const fetchSavedAssets = async () => {
        setLoading(true);
        try {
            const savedIdsString = localStorage.getItem('fleet-iq-favorites');
            if (!savedIdsString) {
                setSavedAssets([]);
                setLoading(false);
                return;
            }

            const savedIds: string[] = JSON.parse(savedIdsString);
            if (savedIds.length === 0) {
                setSavedAssets([]);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('assets')
                .select(`
          *,
          profiles (
            company_name,
            full_name,
            is_verified
          ),
          reviews (
            rating
          )
        `)
                .in('id', savedIds);

            if (error) throw error;

            if (data) {
                const mappedAssets = data.map((asset: any) => {
                    const reviews = asset.reviews || [];
                    const totalRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
                    const reviewCount = reviews.length;
                    const averageRating = reviewCount > 0
                        ? Number((totalRating / reviewCount).toFixed(1))
                        : 0;

                    return {
                        id: asset.id,
                        title: asset.title,
                        type: asset.type,
                        price: Number(asset.price),
                        priceDuration: asset.price_duration,
                        tripDuration: asset.trip_duration,
                        currency: asset.currency,
                        imageUrl: asset.image_url,
                        gallery: asset.gallery || [],
                        location: asset.location,
                        coordinates: { lat: asset.lat || 0, lng: asset.lng || 0 },
                        rating: averageRating,
                        reviewCount: reviewCount,
                        isAvailable: asset.is_available,
                        description: asset.description,
                        features: asset.features || [],
                        specs: asset.specs || { capacity: 4, crewIncluded: false },
                        owner: {
                            name: asset.profiles?.company_name || asset.profiles?.full_name || 'Host',
                            isVerified: asset.profiles?.is_verified,
                            type: asset.profiles?.company_name ? 'COMPANY' : 'INDIVIDUAL',
                            avatarUrl: asset.profiles?.avatar_url,
                        },
                        ratingCategories: { cleanliness: 5, accuracy: 5, checkIn: 5, communication: 5, location: 5, value: 5 },
                        reviews: [],
                        crewIds: [],
                    };
                });
                setSavedAssets(mappedAssets);
            }
        } catch (error) {
            console.error("Error fetching saved assets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = (e: React.MouseEvent, assetId: string) => {
        e.stopPropagation();
        const savedIdsString = localStorage.getItem('fleet-iq-favorites');
        if (savedIdsString) {
            let savedIds: string[] = JSON.parse(savedIdsString);
            savedIds = savedIds.filter(id => id !== assetId);
            localStorage.setItem('fleet-iq-favorites', JSON.stringify(savedIds));
            // Update local state immediately
            setSavedAssets(prev => prev.filter(a => a.id !== assetId));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Saved Assets</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {savedAssets.length} {savedAssets.length === 1 ? 'item' : 'items'} saved
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-3" />
                            <p>Loading favorites...</p>
                        </div>
                    ) : savedAssets.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {savedAssets.map((asset) => (
                                <div
                                    key={asset.id}
                                    onClick={() => { onClose(); navigate(`/assets/${asset.id}`); }}
                                    className="group flex gap-4 p-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer hover:shadow-md"
                                >
                                    {/* Image */}
                                    <div className="w-24 h-24 sm:w-32 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-slate-200">
                                        <img src={asset.imageUrl} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-slate-900 dark:text-white truncate pr-4">{asset.title}</h3>
                                                <button
                                                    onClick={(e) => handleRemove(e, asset.id)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors p-1 -mr-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                                                    title="Remove from favorites"
                                                >
                                                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                                                </button>
                                            </div>
                                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                {asset.location}
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between mt-2">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-lg font-bold text-slate-900 dark:text-white">{formatPrice(asset.price)}</span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">/{asset.priceDuration}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-xs font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                                                <Star className="w-3 h-3 fill-slate-900 dark:fill-white mr-1" />
                                                {asset.rating}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Heart className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No saved assets yet</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto mb-6">
                                Click the heart icon on any asset to save it here for quick access later.
                            </p>
                            <Button onClick={() => { onClose(); navigate('/'); }}>
                                Browse Fleet
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
