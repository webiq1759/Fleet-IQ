import React, { useState } from 'react';
import { ChevronLeft, Star, Droplets, Check, Key, Music, Tag, X } from 'lucide-react';
import { Asset } from '../types';

interface AllReviewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: Asset;
    isGuestFavorite: boolean;
}

export const AllReviewsModal: React.FC<AllReviewsModalProps> = ({ isOpen, onClose, asset, isGuestFavorite }) => {
    const [activeFilter, setActiveFilter] = useState<string>('All reviews');

    if (!isOpen || !asset) return null;

    const ratingCategories = [
        { label: 'Cleanliness', score: asset.ratingCategories?.cleanliness || 0, icon: <Droplets className="w-5 h-5 md:w-6 md:h-6 outline-slate-900" /> },
        { label: 'Accuracy', score: asset.ratingCategories?.accuracy || 0, icon: <Check className="w-5 h-5 md:w-6 md:h-6 outline-slate-900" /> },
        { label: 'Check-in', score: asset.ratingCategories?.tripExperience || 0, icon: <Key className="w-5 h-5 md:w-6 md:h-6 outline-slate-900" /> },
        { label: 'Communication', score: asset.ratingCategories?.communication || 0, icon: <Music className="w-5 h-5 md:w-6 md:h-6 outline-slate-900" /> },
        { label: 'Value', score: asset.ratingCategories?.value || 0, icon: <Tag className="w-5 h-5 md:w-6 md:h-6 outline-slate-900" /> }
    ];

    const filterOptions = ['All reviews', ...ratingCategories.map(c => c.label)];

    const filteredReviews = asset.reviews?.filter(r => {
        if (activeFilter === 'All reviews') return true;
        return r.comment.toLowerCase().includes(activeFilter.toLowerCase());
    }) || [];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-slate-950 sm:bg-black/50 sm:backdrop-blur-sm sm:p-4 md:p-8 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-950 w-full h-full sm:h-[90vh] sm:max-w-4xl md:max-w-5xl sm:rounded-2xl shadow-xl md:shadow-2xl overflow-hidden flex flex-col md:flex-row relative text-slate-900 dark:text-white">

                {/* ---------------- MOBILE LAYOUT (Hidden on md and up) ---------------- */}
                <div className="flex flex-col h-full w-full md:hidden">
                    {/* Header Navbar */}
                    <div className="flex items-center p-4 pb-2">
                        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {/* Top Stats Section */}
                        <div className="px-6 pb-8 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col">
                                <h1 className="text-4xl font-extrabold flex items-center gap-3 mb-8">
                                    <Star className="w-8 h-8 fill-slate-900 dark:fill-white" />
                                    {asset.rating.toFixed(2)}
                                </h1>

                                {/* Horizontal Scrolling Metrics */}
                                <div className="flex overflow-x-auto no-scrollbar gap-6 pb-4 w-full snap-x">
                                    {/* Overall Rating Column */}
                                    <div className="min-w-[220px] shrink-0 pr-6 border-r border-slate-200 dark:border-slate-800 snap-start">
                                        <h4 className="font-semibold mb-3 text-base">Overall rating</h4>
                                        <div className="space-y-1">
                                            {[5, 4, 3, 2, 1].map((level) => {
                                                const count = asset.starCounts ? asset.starCounts[level as 1 | 2 | 3 | 4 | 5] : 0;
                                                const total = asset.reviewCount || 1;
                                                const percentage = Math.round((count / total) * 100);

                                                return (
                                                    <div key={level} className="flex items-center gap-2 text-xs font-semibold">
                                                        <span className="w-2">{level}</span>
                                                        <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-slate-900 dark:bg-white rounded-full" style={{ width: `${percentage}%` }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Category Columns */}
                                    {ratingCategories.map((cat, i) => (
                                        <div key={i} className={`flex flex-col justify-between shrink-0 min-w-[110px] snap-start ${i < ratingCategories.length - 1 ? 'pr-6 border-r border-slate-200 dark:border-slate-800' : ''}`}>
                                            <span className="font-semibold text-sm">{cat.label}</span>
                                            <div className="flex flex-col pt-3">
                                                <div className="text-sm font-semibold mb-2">{cat.score.toFixed(1)}</div>
                                                <div className="opacity-80 stroke-[1.5]">{cat.icon}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: Reviews List & Filters */}
                        <div className="px-6 py-8">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold mb-6">
                                    {asset.reviewCount} reviews
                                </h2>

                                {/* Filter Pills */}
                                <div className="flex overflow-x-auto gap-3 no-scrollbar pb-2">
                                    {filterOptions.map(option => (
                                        <button
                                            key={option}
                                            onClick={() => setActiveFilter(option)}
                                            className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${activeFilter === option
                                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white'
                                                : 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-300 border-transparent hover:border-slate-900 dark:hover:border-white'
                                                }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reviews Grid */}
                            <div className="space-y-10 mt-6">
                                {filteredReviews.length === 0 ? (
                                    <div className="text-slate-500 mt-6 text-center">
                                        No reviews explicitly mention "{activeFilter}".
                                    </div>
                                ) : (
                                    filteredReviews.map((review) => (
                                        <div key={review.id} className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                                    <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-base">{review.userName}</h4>
                                                    <div className="text-sm text-slate-500 flex items-center">
                                                        {review.userLocation} · {review.date}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-slate-900 dark:fill-white text-slate-900 dark:text-white' : 'text-slate-200 dark:text-slate-700'}`} />
                                                ))}
                                            </div>
                                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base whitespace-pre-line">
                                                {review.comment}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ---------------- DESKTOP LAYOUT (Hidden on mobile) ---------------- */}
                <div className="hidden md:flex w-full h-full relative">
                    {/* Close Button Header */}
                    <div className="absolute top-4 right-4 z-10">
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <X className="w-6 h-6 text-slate-900 dark:text-white" />
                        </button>
                    </div>

                    {/* LEFT COLUMN: Rating Stats */}
                    <div className={`w-5/12 p-12 overflow-y-auto border-r border-slate-100 dark:border-slate-800 scrollbar-hide flex flex-col items-start text-left ${isGuestFavorite ? 'bg-gradient-to-br from-orange-50/50 to-white dark:from-slate-900 dark:to-slate-950' : 'bg-white dark:bg-slate-950'}`}>
                        {/* Rating Header Block */}
                        <div className="mb-12 w-full flex flex-col items-start">
                            <h1 className="text-7xl font-extrabold text-slate-900 dark:text-white tracking-tighter leading-tight mb-2">
                                {asset.rating.toFixed(2)}
                            </h1>
                            {isGuestFavorite && (
                                <>
                                    <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-500 mb-3">
                                        Renter's Favorite
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm leading-relaxed">
                                        This asset is one of the most loved by renters on FleetIQ based on ratings, reviews, and reliability.
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Overall Rating Distribution */}
                        <div className="mb-10 w-full max-w-sm">
                            <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-left">Overall rating</h4>
                            <div className="space-y-2">
                                {[5, 4, 3, 2, 1].map((level) => {
                                    const count = asset.starCounts ? asset.starCounts[level as 1 | 2 | 3 | 4 | 5] : 0;
                                    const total = asset.reviewCount || 1;
                                    const percentage = Math.round((count / total) * 100);

                                    return (
                                        <div key={level} className="flex items-center gap-3 text-sm text-slate-900 dark:text-white">
                                            <span className="w-2">{level}</span>
                                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Rating Categories */}
                        <div className="space-y-6 w-full max-w-sm">
                            {ratingCategories.map((cat, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
                                        {cat.icon}
                                        <span className="text-sm font-medium">{cat.label}</span>
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white">{cat.score.toFixed(1)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Reviews List */}
                    <div className="w-7/12 flex flex-col h-full bg-white dark:bg-slate-950">
                        <div className="p-12 pb-6 border-b border-slate-100 dark:border-slate-800 mt-2">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
                                {asset.reviewCount} reviews
                            </h2>

                            {/* Filter Pills */}
                            <div className="flex flex-wrap gap-2 pr-4">
                                {filterOptions.map(option => (
                                    <button
                                        key={option}
                                        onClick={() => setActiveFilter(option)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${activeFilter === option
                                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:border-slate-500'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 pt-6 space-y-10 custom-scrollbar pr-4">
                            {filteredReviews.length === 0 ? (
                                <div className="text-center text-slate-500 dark:text-slate-400 mt-10">
                                    No reviews explicitly mention "{activeFilter}".
                                </div>
                            ) : (
                                filteredReviews.map((review) => (
                                    <div key={review.id} className="space-y-4 max-w-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                                <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white text-base">{review.userName}</h4>
                                                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
                                                    {review.userLocation} · {review.date}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-slate-900 dark:fill-white text-slate-900 dark:text-white' : 'text-slate-200 dark:text-slate-700'}`} />
                                            ))}
                                        </div>
                                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base whitespace-pre-line">
                                            {review.comment}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
