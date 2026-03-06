import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { X, Star, ShieldCheck, Award, ChevronLeft, ChevronRight, Briefcase, GraduationCap, Globe, Heart, Music, Coffee, MapPin, User, Lightbulb, PawPrint } from 'lucide-react';
import { Asset, Review } from '../types';
import { AssetCard } from './AssetCard';
import { Button } from './Button';
import { supabase } from '../supabaseClient';

interface HostProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    owner: Asset['owner'];
    listings: Asset[];
}

export const HostProfileModal: React.FC<HostProfileModalProps> = ({ isOpen, onClose, owner, listings }) => {
    const navigate = useNavigate();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const reviewsScrollRef = useRef<HTMLDivElement>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    useEffect(() => {
        if (isOpen && owner.id) {
            const fetchReviews = async () => {
                setLoadingReviews(true);
                try {
                    // Fetch reviews for assets owned by this owner
                    const { data, error } = await supabase
                        .from('reviews')
                        .select('*, profiles(full_name, avatar_url, location), assets!inner(owner_id)')
                        .eq('assets.owner_id', owner.id)
                        .order('created_at', { ascending: false })
                        .limit(10);

                    if (error) throw error;

                    if (data) {
                        const mappedReviews: Review[] = data.map((r: any) => ({
                            id: r.id,
                            userId: r.user_id,
                            userName: r.profiles?.full_name || 'Anonymous',
                            userAvatar: r.profiles?.avatar_url || 'https://via.placeholder.com/150',
                            userLocation: r.profiles?.location || 'Unknown',
                            date: new Date(r.created_at).toLocaleDateString(),
                            rating: r.rating,
                            comment: r.comment,
                        }));
                        setReviews(mappedReviews);
                    }
                } catch (err) {
                    console.error("Error fetching host reviews:", err);
                } finally {
                    setLoadingReviews(false);
                }
            };
            fetchReviews();
        }
    }, [isOpen, owner.id]);

    if (!isOpen) return null;

    const scroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
        if (ref.current) {
            const scrollAmount = direction === 'left' ? -340 : 340;
            ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const interests = [
        { icon: <Briefcase className="w-5 h-5" />, label: 'Business' },
        { icon: <Globe className="w-5 h-5" />, label: 'Travel' },
        { icon: <Music className="w-5 h-5" />, label: 'Music' },
        { icon: <Coffee className="w-5 h-5" />, label: 'Dining' },
        { icon: <Heart className="w-5 h-5" />, label: 'Wellness' },
        { icon: <User className="w-5 h-5" />, label: 'Networking' },
    ];



    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white dark:bg-slate-950 w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={onClose}
                        className="p-2 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors shadow-sm border border-slate-100 dark:border-slate-700"
                    >
                        <X className="w-5 h-5 text-slate-900 dark:text-white" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 md:p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
                        {/* Profile Card - Matched to design */}
                        <div className="lg:col-span-4">
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none sticky top-0">
                                <div className="flex flex-row items-center justify-between gap-6">
                                    {/* Identity */}
                                    <div className="flex flex-col items-center text-center w-1/2">
                                        <div className="relative mb-3">
                                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-100">
                                                {owner.avatarUrl ? (
                                                    <img src={owner.avatarUrl} alt={owner.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-3xl font-bold">{owner.name.charAt(0)}</div>
                                                )}
                                            </div>
                                            {owner.isSuperhost && (
                                                <div className="absolute bottom-0 right-0 bg-[#E91E63] text-white p-1.5 rounded-full border-[3px] border-white dark:border-slate-900 shadow-sm">
                                                    <Award className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-1">{owner.name}</h2>
                                        {owner.isSuperhost && (
                                            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                                                Superhost
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex flex-col w-1/2 space-y-4">
                                        <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                                            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{owner.reviewCount}</div>
                                            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-0.5">Reviews</div>
                                        </div>
                                        <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                                            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center">
                                                {owner.rating} <Star className="w-3.5 h-3.5 ml-1.5 fill-slate-900 dark:fill-white" />
                                            </div>
                                            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-0.5">Rating</div>
                                        </div>
                                        <div>
                                            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{owner.joinedDate}</div>
                                            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-0.5">Years active</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* About Details */}
                        <div className="lg:col-span-8 space-y-8">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">About {owner.name}</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    {/* Work */}
                                    {owner.work && (
                                        <div className="flex items-start">
                                            <div className="mr-3 mt-1 text-slate-900 dark:text-white">
                                                <Briefcase className="w-5 h-5" />
                                            </div>
                                            <span className="text-slate-600 dark:text-slate-300">
                                                My work: {owner.work}
                                            </span>
                                        </div>
                                    )}

                                    {/* Languages */}
                                    {owner.languages && owner.languages.length > 0 && (
                                        <div className="flex items-start">
                                            <div className="mr-3 mt-1 text-slate-900 dark:text-white">
                                                <Globe className="w-5 h-5" />
                                            </div>
                                            <span className="text-slate-600 dark:text-slate-300">
                                                Speaks {owner.languages.join(', ')}
                                            </span>
                                        </div>
                                    )}

                                    {owner.funFacts?.map((fact, idx) => (
                                        <div key={idx} className="flex items-start">
                                            <div className="mr-3 mt-1 text-slate-900 dark:text-white">
                                                {fact.icon === 'school' && <GraduationCap className="w-5 h-5" />}
                                                {fact.icon === 'work' && <Briefcase className="w-5 h-5" />}
                                                {fact.icon === 'language' && <Globe className="w-5 h-5" />}
                                                {fact.icon === 'song' && <Music className="w-5 h-5" />}
                                                {fact.icon === 'fun-fact' && <Lightbulb className="w-5 h-5" />}
                                                {fact.icon === 'pets' && <PawPrint className="w-5 h-5" />}
                                            </div>
                                            <span className="text-slate-600 dark:text-slate-300">
                                                {fact.label === 'School' ? 'Where I went to school: ' :
                                                    fact.label === 'Work' ? 'My work: ' :
                                                        fact.label === 'Languages' ? 'Speaks ' : ''}
                                                {fact.text}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex items-start">
                                        <MapPin className="w-5 h-5 mr-3 mt-1 text-slate-900 dark:text-white" />
                                        <span className="text-slate-600 dark:text-slate-300">Lives in Lagos, Nigeria</span>
                                    </div>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                                    {owner.bio}
                                </p>
                            </div>

                            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Ask {owner.name} about</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {interests.map((interest, idx) => (
                                        <div key={idx} className="flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-900 dark:hover:border-white transition-colors bg-white dark:bg-slate-900">
                                            <span className="text-slate-900 dark:text-white mr-3">{interest.icon}</span>
                                            <span className="font-medium text-slate-900 dark:text-white">{interest.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reviews Carousel */}
                    <div className="mb-12 border-t border-slate-100 dark:border-slate-800 pt-10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">What guests are saying about {owner.name}</h2>
                            <div className="flex gap-2">
                                <button onClick={() => scroll(reviewsScrollRef, 'left')} className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                </button>
                                <button onClick={() => scroll(reviewsScrollRef, 'right')} className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                </button>
                            </div>
                        </div>

                        <div
                            ref={reviewsScrollRef}
                            className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2 snap-x"
                        >
                            {loadingReviews ? (
                                <div className="p-4 text-slate-500 font-medium">Loading reviews...</div>
                            ) : reviews.length > 0 ? (
                                reviews.map((review) => (
                                    <div key={review.id} className="min-w-[300px] md:min-w-[400px] bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm snap-start">
                                        <div className="flex items-center mb-4">
                                            <img src={review.userAvatar} alt={review.userName} className="w-12 h-12 rounded-full object-cover mr-4" />
                                            <div>
                                                <h4 className="font-semibold text-slate-900 dark:text-white">{review.userName}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{review.userLocation} · {review.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex mb-3">
                                            {[...Array(review.rating)].map((_, i) => (
                                                <Star key={i} className="w-3.5 h-3.5 fill-slate-900 dark:fill-white text-slate-900 dark:text-white" />
                                            ))}
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                                            "{review.comment}"
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-slate-500 italic">No reviews yet for this host.</div>
                            )}
                        </div>
                    </div>

                    {/* Listings Carousel */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{owner.name}'s listings</h2>
                            <div className="flex gap-2">
                                <button onClick={() => scroll(scrollContainerRef, 'left')} className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                </button>
                                <button onClick={() => scroll(scrollContainerRef, 'right')} className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                </button>
                            </div>
                        </div>

                        <div
                            ref={scrollContainerRef}
                            className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2 snap-x"
                        >
                            {listings.length > 0 ? listings.map((item) => (
                                <div key={item.id} className="min-w-[280px] w-[280px] md:min-w-[320px] md:w-[320px] snap-start">
                                    <AssetCard asset={item} />
                                </div>
                            )) : (
                                <p className="text-slate-500 dark:text-slate-400">No other listings available.</p>
                            )}
                        </div>
                        <div className="mt-8">
                            <Button
                                variant="outline"
                                className="w-full !text-slate-900 dark:!text-white bg-transparent border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                onClick={() => {
                                    const slug = owner.name.toLowerCase().replace(/\s+/g, '-');
                                    navigate(`/book/${slug}`);
                                    onClose();
                                }}
                            >
                                View all listings
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};