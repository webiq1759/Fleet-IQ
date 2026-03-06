
import React, { useState } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Button } from './Button';
import { useNotification } from '../contexts/NotificationContext';

interface LeaveReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    assetId: string;
    assetTitle: string;
    hostName: string;
    onReviewSubmitted: () => void;
}

export const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({
    isOpen,
    onClose,
    assetId,
    assetTitle,
    hostName,
    onReviewSubmitted
}) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [cleanliness, setCleanliness] = useState(0);
    const [accuracy, setAccuracy] = useState(0);
    const [tripExperience, setTripExperience] = useState(0);
    const [communication, setCommunication] = useState(0);
    const [value, setValue] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { addToast } = useNotification();

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            addToast("Rating Required", "Please provide an overall rating.", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error("User not authenticated");

            const { error } = await supabase
                .from('reviews')
                .insert({
                    asset_id: assetId,
                    user_id: user.id,
                    rating: rating,
                    comment: comment,
                    cleanliness_rating: cleanliness || rating,
                    accuracy_rating: accuracy || rating, // Explicit mapping to match DB column
                    trip_experience_rating: tripExperience || rating,
                    communication_rating: communication || rating,
                    value_rating: value || rating
                });

            if (error) throw error;

            addToast("Review Submitted", "Thank you for your feedback!", "success");
            onReviewSubmitted();
            onClose();
            // Reset form
            setRating(0);
            setComment('');
            setCleanliness(0);
            setAccuracy(0);
            setTripExperience(0);
            setCommunication(0);
            setValue(0);

        } catch (error: any) {
            console.error("Error submitting review:", error);
            addToast("Submission Failed", error.message || "Failed to submit review. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const StarRating = ({ label, value, onChange, size = "sm" }: { label: string, value: number, onChange: (val: number) => void, size?: "sm" | "lg" }) => (
        <div className={`flex ${size === "lg" ? "flex-col items-center gap-2" : "justify-between items-center w-full"}`}>
            <label className={`text-slate-600 dark:text-slate-300 font-medium ${size === "lg" ? "text-lg" : "text-sm"}`}>{label}</label>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => onChange(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                        type="button"
                    >
                        <Star
                            className={`${size === "lg" ? "w-8 h-8" : "w-5 h-5"} ${star <= value
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-slate-300 dark:text-slate-600"
                                }`}
                        />
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Rate your experience</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {assetTitle} • Hosted by <span className="font-medium text-slate-700 dark:text-slate-300">{hostName}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto space-y-8">

                    {/* Overall Rating */}
                    <div className="flex justify-center py-2">
                        <StarRating label="Overall Rating" value={rating} onChange={setRating} size="lg" />
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Detailed Ratings */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Detailed Ratings</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <StarRating label="Cleanliness" value={cleanliness} onChange={setCleanliness} />
                            <StarRating label="Accuracy" value={accuracy} onChange={setAccuracy} />
                            <StarRating label="Trip Experience" value={tripExperience} onChange={setTripExperience} />
                            <StarRating label="Communication" value={communication} onChange={setCommunication} />
                            <StarRating label="Value" value={value} onChange={setValue} />
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Comment */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Your Review</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience with this fleet..."
                            className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all text-slate-900 dark:text-white h-32 resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Publishing...
                            </>
                        ) : 'Publish Review'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
