
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Car, Plane, Anchor, Truck, Disc, Check, ChevronLeft, ChevronRight, AlertCircle, Loader2, Sparkles, Trash2, Star, Image as ImageIcon, Wrench, Fuel, Settings2, ShieldCheck, Users } from 'lucide-react';
import { Button } from './Button';
import { CustomAlertModal } from './CustomAlertModal';
import { AssetType, Asset, CrewMember } from '../types';
import { supabase } from '../supabaseClient';
import { usePreferences } from '../contexts/PreferencesContext';
import { countries } from '../data/countries';
import { getCommissionRate, OWNER_COMMISSION_SHARE } from '../utils/commission';

interface AddFleetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (fleet: Partial<Asset>) => void;
    initialData?: Asset | null;
}

const ASSET_FEATURES: Record<string, string[]> = {
    [AssetType.VEHICLE]: [
        'Air Conditioning', 'Heater', 'Bluetooth', 'Navigation System', 'Backup Camera',
        'Heated Seats', 'Sunroof', 'Leather Seats', 'Third-row Seating', 'Tow Hitch',
        'Mirror Ceiling', 'Tinted Windows', 'Premium Sound', 'Blind Spot Monitoring', 'Chauffeur Partition'
    ],
    [AssetType.YACHT]: [
        'Jacuzzi', 'Helipad', 'Jet Skis', 'Scuba Gear', 'Master Suite',
        'Crew Quarters', 'Sun Deck', 'Wet Bar', 'WiFi', 'Fishing Gear',
        'Stabilizers', 'Water Slide', 'Tender Boat'
    ],
    [AssetType.PLANE]: [
        'WiFi', 'Satellite Phone', 'Conference Table', 'Private Bedroom', 'Shower',
        'Full Galley', 'Flight Attendant', 'Entertainment System', 'Lay-flat Seats',
        'Pressurized Cabin', 'Smoking Allowed'
    ],
    [AssetType.HELICOPTER]: [
        'Noise-canceling Headsets', 'Climate Control', 'Leather Interior', 'Bose Sound',
        'Cargo Basket', 'Emergency Floats', 'Dual Controls', 'Night Vision', 'VIP Configuration'
    ],
    [AssetType.TRUCK]: [
        'GPS Tracking', 'Sleeper Cab', 'Refrigeration Unit', 'Lift Gate', 'Air Suspension',
        'CB Radio', 'Dash Cam', 'Electronic Logbook', 'Heavy Duty Towing', 'Hazardous Material Ready'
    ],
    [AssetType.CONVOY]: [
        'Armored Vehicles', 'Tinted Windows', 'Emergency Lights', 'Run-Flat Tires',
        'Bulletproof Glass', 'Satellite Comms', 'Medical Kit', 'Backup Vehicle', 'GPS Tracking'
    ]
};

const FUEL_TYPES: Record<string, string[]> = {
    [AssetType.VEHICLE]: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'],
    [AssetType.TRUCK]: ['Diesel', 'Gasoline', 'Electric', 'Hybrid'],
    [AssetType.YACHT]: ['Diesel', 'Gasoline', 'Hybrid', 'Electric', 'Sail'],
    [AssetType.PLANE]: ['Jet-A', 'Avgas', 'Electric', 'Mogas'],
    [AssetType.HELICOPTER]: ['Jet-A', 'Avgas'],
    [AssetType.CONVOY]: ['Gasoline', 'Diesel', 'Hybrid']
};

interface GalleryItem {
    file?: File;
    preview: string;
    isExisting?: boolean;
}

export const AddFleetModal: React.FC<AddFleetModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
    const { currency, formatPrice } = usePreferences();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [alertData, setAlertData] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'warning' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'error'
    });

    const [formData, setFormData] = useState({
        title: '',
        type: AssetType.VEHICLE,
        price: '',
        priceDuration: '24h',
        location: '',
        description: '',
        capacity: '',
        speed: '',
        fuelType: '',
        transmission: '',
        nextServiceDate: '',
        crewIncluded: true,
        features: [] as string[],
        licensePlate: '',
        tripDuration: 24, // Default to 24 or dynamically set
        country: '',
        state: '',
        securityFeatures: { included: false, count: 0, type: '', armed: false },
        convoyDetails: [] as Array<{ id: string; make: string; model: string; licensePlate: string; documentUrl: string }>,
        documents: { registration: '', insurance: '' }
    });

    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [coverIndex, setCoverIndex] = useState(0);
    const [availableCrew, setAvailableCrew] = useState<CrewMember[]>([]);

    useEffect(() => {
        if (isOpen) {
            const fetchCrew = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data, error } = await supabase
                        .from('crew_members')
                        .select('*')
                        .eq('owner_id', user.id)
                        .in('status', ['Active', 'Pending']);
                    if (!error && data) {
                        setAvailableCrew(data as CrewMember[]);
                    }
                }
            };
            fetchCrew();
        }
    }, [isOpen]);

    // Initialize form when initialData changes or modal opens
    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                type: initialData.type,
                price: (initialData.price * currency.rate).toString(), // Display in current currency roughly (NOTE: Stored as base USD)
                priceDuration: initialData.priceDuration || '24h',
                location: initialData.location,
                description: initialData.description,
                capacity: initialData.specs.capacity.toString(),
                speed: initialData.specs.speed || '',
                fuelType: initialData.specs.fuelType || '',
                transmission: initialData.specs.transmission || '',
                nextServiceDate: initialData.nextServiceDate || '',
                crewIncluded: initialData.specs.crewIncluded,
                features: initialData.features || [],
                licensePlate: initialData.licensePlate || '',
                securityFeatures: initialData.securityFeatures || { included: false, count: 0, type: '', armed: false },
                convoyDetails: (initialData.convoyDetails || []).map(d => ({ ...d, id: Math.random().toString(36).substr(2, 9) })), // Populate existing convoy details with temp IDs
                documents: initialData.documents || { registration: '', insurance: '' },
                country: initialData.country || '',
                state: initialData.state || '',
                tripDuration: initialData.tripDuration || 24
            });

            // Initialize gallery with existing images
            if (initialData.gallery && initialData.gallery.length > 0) {
                setGallery(initialData.gallery.map(url => ({
                    preview: url,
                    isExisting: true
                })));
                // Find index of cover image if possible, otherwise 0
                const idx = initialData.gallery.findIndex(url => url === initialData.imageUrl);
                setCoverIndex(idx >= 0 ? idx : 0);
            }
        } else {
            // Reset defaults for new entry
            setFormData({
                title: '',
                type: AssetType.VEHICLE,
                price: '',
                priceDuration: '24h',
                location: '',
                description: '',
                capacity: '',
                speed: '',
                fuelType: '',
                transmission: '',
                nextServiceDate: '',
                crewIncluded: true,
                features: [] as string[], // Explicitly cast
                licensePlate: '',
                securityFeatures: { included: false, count: 0, type: '', armed: false },
                documents: { registration: '', insurance: '' },
                country: '',
                state: '',
                tripDuration: 24
            });
            setGallery([]);
            setCoverIndex(0);
        }
        setStep(1);
    }, [initialData, isOpen]); // removed currency dependency to avoid overwrite on currency change

    // Clean up object URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            gallery.forEach(item => {
                if (!item.isExisting) URL.revokeObjectURL(item.preview);
            });
        };
    }, [gallery]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (gallery.length === 0) {
            setAlertData({ isOpen: true, title: 'Missing Images', message: 'Please upload at least one image.', type: 'error' });
            return;
        }
        setIsSubmitting(true);

        try {
            // 1. Handle Images
            const finalGalleryUrls: string[] = [];

            // Process gallery items
            for (const item of gallery) {
                if (item.isExisting) {
                    finalGalleryUrls.push(item.preview);
                } else if (item.file) {
                    // Upload new file
                    const fileExt = item.file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('media')
                        .upload(filePath, item.file as Blob);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('media')
                        .getPublicUrl(filePath);

                    finalGalleryUrls.push(publicUrl);
                }
            }

            // Determine cover image URL
            const coverImageUrl = finalGalleryUrls[coverIndex] || finalGalleryUrls[0];

            // 2. Get Current User
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("You must be logged in to manage assets");

            // Calculate price in USD base for storage
            const priceInUSD = Number(formData.price) / currency.rate;

            // 3. Prepare Payload
            const assetPayload = {
                owner_id: user.id,
                title: formData.title,
                type: formData.type,
                price: priceInUSD,
                price_duration: formData.priceDuration,
                trip_duration: formData.priceDuration === 'Custom' ? formData.tripDuration : parseInt(formData.priceDuration.replace('h', '')) || 24,
                location: formData.location, // Providing specific address
                country: formData.country,
                state: formData.state,
                image_url: coverImageUrl,
                gallery: finalGalleryUrls,
                description: formData.description,
                is_available: true,
                next_service_date: formData.nextServiceDate || null,
                specs: {
                    capacity: Number(formData.capacity) || 4,
                    speed: formData.speed || 'N/A',
                    fuelType: formData.fuelType,
                    transmission: formData.transmission,
                    crewIncluded: formData.crewIncluded
                },
                features: formData.features,
                security_features: formData.securityFeatures,
                status: initialData ? initialData.status : 'Pending', // Keep existing status on edit
                convoy_details: formData.type === AssetType.CONVOY
                    ? formData.convoyDetails.map(({ id, ...rest }) => rest) // Remove temporary IDs
                    : null,
                documents: formData.documents
            };

            let result;

            if (initialData) {
                // UPDATE Mode
                const { data, error } = await supabase
                    .from('assets')
                    .update(assetPayload)
                    .eq('id', initialData.id)
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            } else {
                // INSERT Mode
                const { data, error } = await supabase
                    .from('assets')
                    .insert([assetPayload])
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            }

            // 4. Update Parent State
            onSuccess({ ...assetPayload, id: result.id } as any);

            onClose();

        } catch (error: any) {
            console.error('Error saving fleet:', error);
            setAlertData({ isOpen: true, title: 'Validation Error', message: error.message || 'Failed to save asset', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (!formData.title || !formData.price || isNaN(Number(formData.price))) {
                setAlertData({ isOpen: true, title: 'Validation Error', message: 'Please provide a valid Title and Price.', type: 'error' });
                return;
            }
            setStep(2);
        } else if (step === 2) {
            const isConvoy = formData.type === AssetType.CONVOY;
            if (!formData.country || !formData.state || !formData.location) {
                setAlertData({ isOpen: true, title: 'Validation Error', message: 'Please fill in Country, State, and City/Area.', type: 'error' });
                return;
            }
            if (!isConvoy && !formData.licensePlate) {
                setAlertData({ isOpen: true, title: 'Validation Error', message: 'Please provide the License Plate / ID.', type: 'error' });
                return;
            }
            if (isConvoy && (!formData.convoyDetails || formData.convoyDetails.length === 0)) {
                setAlertData({ isOpen: true, title: 'Validation Error', message: 'Please add at least one vehicle to the convoy.', type: 'error' });
                return;
            }
            setStep(3);
        } else if (step === 3) {
            setStep(4);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newItems = Array.from(e.target.files).map((file: any) => ({
                file: file as File,
                preview: URL.createObjectURL(file as Blob),
                isExisting: false
            }));
            setGallery(prev => [...prev, ...newItems]);
        }
    };

    const removeImage = (index: number) => {
        setGallery(prev => {
            const newGallery = prev.filter((_, i) => i !== index);
            if (index === coverIndex) setCoverIndex(0);
            else if (index < coverIndex) setCoverIndex(coverIndex - 1);
            return newGallery;
        });
    };

    const toggleFeature = (feature: string) => {
        setFormData(prev => {
            const exists = prev.features.includes(feature);
            if (exists) {
                return { ...prev, features: prev.features.filter(f => f !== feature) };
            } else {
                return { ...prev, features: [...prev.features, feature] };
            }
        });
    };

    const categories = [
        { label: 'Vehicle', type: AssetType.VEHICLE, icon: Car },
        { label: 'Yacht', type: AssetType.YACHT, icon: Anchor },
        { label: 'Plane', type: AssetType.PLANE, icon: Plane },
        { label: 'Helicopter', type: AssetType.HELICOPTER, icon: Disc },
        { label: 'Truck', type: AssetType.TRUCK, icon: Truck },
    ];

    const showTransmission = formData.type === AssetType.VEHICLE || formData.type === AssetType.TRUCK || formData.type === AssetType.CONVOY;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 w-full h-full md:h-[95vh] md:max-h-[95vh] md:w-[95vw] md:max-w-6xl md:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-0 md:border border-slate-100 dark:border-slate-800 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{initialData ? 'Edit Asset' : 'List New Asset'}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Step {step} of 4: {
                            step === 1 ? 'Asset Type & Basics' :
                                step === 2 ? 'Location & Fleet Logistics' :
                                    step === 3 ? 'Specifications & Amenities' :
                                        'Media Gallery & Overview'
                        }</p>

                        {/* Progress Bar */}
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-200 dark:bg-slate-800">
                            <div
                                className="h-full bg-red-500 transition-all duration-300 ease-in-out"
                                style={{ width: `${(step / 4) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                    <form id="add-fleet-form" onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                {/* Category Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Asset Type</label>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.label}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: cat.type })}
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${formData.type === cat.type
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 ring-1 ring-red-500'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800'
                                                    }`}
                                            >
                                                <cat.icon className="w-6 h-6 mb-2" />
                                                <span className="text-xs font-medium">{cat.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Asset Title */}
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Asset Title <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. 2024 Mercedes G63"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Price ({currency.code}) <span className="text-red-500">*</span></label>
                                        <div className="flex gap-4">
                                            <input
                                                type="number"
                                                required
                                                placeholder="0.00"
                                                min="0"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white transition-all"
                                            />
                                            <select
                                                value={formData.priceDuration}
                                                onChange={(e) => setFormData({ ...formData, priceDuration: e.target.value })}
                                                className="w-32 px-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white transition-all"
                                            >
                                                <option value="6h">Per 6h</option>
                                                <option value="12h">Per 12h</option>
                                                <option value="24h">Per 24h</option>
                                                <option value="Custom">Custom</option>
                                            </select>
                                        </div>
                                        {formData.priceDuration === 'Custom' && (
                                            <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Duration (hours)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    required={formData.priceDuration === 'Custom'}
                                                    placeholder="e.g. 5"
                                                    value={formData.tripDuration || ''}
                                                    onChange={(e) => setFormData({ ...formData, tripDuration: parseInt(e.target.value) || 0 })}
                                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white transition-all text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {formData.type && formData.price && !isNaN(Number(formData.price)) && (
                                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mt-4 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-800 dark:text-blue-300">
                                            <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                                                Platform Commission ({getCommissionRate(formData.type) * 100}%)
                                            </p>
                                            <p>
                                                FleetIQ applies a {getCommissionRate(formData.type) * 100}% network matching fee for {formData.type}s.
                                                The renter covers 20% of this fee, and the remaining 80% (which equals {formatPrice((Number(formData.price) / currency.rate) * getCommissionRate(formData.type) * OWNER_COMMISSION_SHARE)}) will be deducted from your final trip payout.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Convoy Toggle for Vehicles (Moved to Step 1) */}
                                {(formData.type === AssetType.VEHICLE || formData.type === AssetType.CONVOY) && (
                                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${formData.type === AssetType.CONVOY ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                    <ShieldCheck className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Is this a Convoy?</h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Enable for motorcades or multi-vehicle security details.</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={formData.type === AssetType.CONVOY}
                                                    onChange={(e) => setFormData({ ...formData, type: e.target.checked ? AssetType.CONVOY : AssetType.VEHICLE })}
                                                />
                                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                {formData.type === AssetType.CONVOY && (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800/50 mb-4 flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                            <strong>Note:</strong> Convoy assets are strictly for vehicle convoys (e.g. security motorcades).
                                        </p>
                                    </div>
                                )}

                                {/* Convoy Vehicle Details */}
                                {(formData.type === AssetType.CONVOY) && (
                                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 transition-all">
                                        <div className="animate-in slide-in-from-top-2">
                                            <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Convoy Vehicles & Assignments</h4>
                                            <div className="space-y-4">
                                                {(formData.convoyDetails || []).map((vehicle, index) => (
                                                    <div key={vehicle.id} className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 relative group">
                                                        <div className="absolute top-2 right-2 flex gap-2">
                                                            {index > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newDetails = [...(formData.convoyDetails || [])];
                                                                        newDetails.splice(index, 1);
                                                                        setFormData({ ...formData, convoyDetails: newDetails });
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Vehicle {index + 1}</h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-xs font-medium text-slate-500 mb-1 block">Make & Model</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="e.g. Toyota Land Cruiser"
                                                                    value={vehicle.make && vehicle.model ? `${vehicle.make} ${vehicle.model}` : vehicle.make || ''}
                                                                    onChange={(e) => {
                                                                        const newDetails = [...(formData.convoyDetails || [])];
                                                                        // Simple split for now, or just store as Make logic if preferred. 
                                                                        // User asked for "Make/Model"
                                                                        newDetails[index] = { ...vehicle, make: e.target.value, model: '' };
                                                                        setFormData({ ...formData, convoyDetails: newDetails });
                                                                    }}
                                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-medium text-slate-500 mb-1 block">License Plate</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="ABC-123-XY"
                                                                    value={vehicle.licensePlate}
                                                                    onChange={(e) => {
                                                                        const newDetails = [...(formData.convoyDetails || [])];
                                                                        newDetails[index] = { ...vehicle, licensePlate: e.target.value };
                                                                        setFormData({ ...formData, convoyDetails: newDetails });
                                                                    }}
                                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                                                />
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <label className="text-xs font-medium text-slate-500 mb-1 block">Assign Crew Member (Driver/Operator)</label>
                                                                <select
                                                                    value={vehicle.assignedCrewId || ''}
                                                                    onChange={(e) => {
                                                                        const newDetails = [...(formData.convoyDetails || [])];
                                                                        newDetails[index] = { ...vehicle, assignedCrewId: e.target.value };
                                                                        setFormData({ ...formData, convoyDetails: newDetails });
                                                                    }}
                                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                                                >
                                                                    <option value="">-- No Crew Assigned --</option>
                                                                    {availableCrew.map(c => (
                                                                        <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <label className="text-xs font-medium text-slate-500 mb-1 block">Vehicle Document (License/Registration)</label>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*,application/pdf"
                                                                        onChange={async (e) => {
                                                                            if (e.target.files?.[0]) {
                                                                                // Handle upload logic here (simplified for inline)
                                                                                const file = e.target.files[0];
                                                                                const fileExt = file.name.split('.').pop();
                                                                                const fileName = `convoy_doc_${Math.random()}.${fileExt}`;

                                                                                // Show loading state implicitly or add UI for it
                                                                                const { data, error } = await supabase.storage.from('media').upload(fileName, file);
                                                                                if (!error) {
                                                                                    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
                                                                                    const newDetails = [...(formData.convoyDetails || [])];
                                                                                    newDetails[index] = { ...vehicle, documentUrl: publicUrl };
                                                                                    setFormData(prev => ({ ...prev, convoyDetails: newDetails }));
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-300"
                                                                    />
                                                                    {vehicle.documentUrl && <Check className="w-4 h-4 text-green-500" />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        convoyDetails: [...(prev.convoyDetails || []), {
                                                            id: Math.random().toString(36).substr(2, 9),
                                                            make: '',
                                                            model: '',
                                                            licensePlate: '',
                                                            documentUrl: '',
                                                            assignedCrewId: ''
                                                        }]
                                                    }))}
                                                    className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                                >
                                                    <Car className="w-4 h-4" /> Add Another Vehicle
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Country <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                required
                                                value={formData.country}
                                                onChange={(e) => setFormData({ ...formData, country: e.target.value, state: '' })}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white transition-all appearance-none"
                                            >
                                                <option value="">Select Country</option>
                                                {countries.map(c => (
                                                    <option key={c.code} value={c.name}>{c.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>

                                    {formData.country && (
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">State <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <select
                                                    required
                                                    value={formData.state}
                                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white transition-all appearance-none"
                                                >
                                                    <option value="">Select State</option>
                                                    {countries.find(c => c.name === formData.country)?.states.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">City / Area Address <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. 123 Admiralty Way, Lekki Phase 1"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white transition-all"
                                        />
                                    </div>

                                    {formData.type !== AssetType.CONVOY && (
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">License Plate / ID <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                required={formData.type !== AssetType.CONVOY}
                                                placeholder="e.g. KSF-123-AB"
                                                value={formData.licensePlate}
                                                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white transition-all"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Document Upload - Full Width */}
                                {formData.type !== AssetType.CONVOY && (
                                    <div className="space-y-1 mt-6">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {formData.type === AssetType.YACHT ? 'Vessel Registration / License' :
                                                formData.type === AssetType.PLANE || formData.type === AssetType.HELICOPTER ? 'Aircraft Registration / Airworthiness Certificate' :
                                                    'Vehicle Papers (Registration/Insurance)'}
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex-1">
                                                <input
                                                    type="file"
                                                    accept="application/pdf,image/*"
                                                    onChange={async (e) => {
                                                        if (e.target.files?.[0]) {
                                                            const file = e.target.files[0];
                                                            const fileExt = file.name.split('.').pop();
                                                            const fileName = `asset_doc_${Math.random()}.${fileExt}`;

                                                            // Simple upload logic inline for now
                                                            const { error } = await supabase.storage.from('media').upload(fileName, file);
                                                            if (!error) {
                                                                const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    documents: { ...prev.documents, registration: publicUrl }
                                                                }));
                                                            }
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 dark:file:bg-slate-700 dark:file:text-white"
                                                />
                                            </div>
                                            {formData.documents?.registration && (
                                                <div className="flex items-center text-green-500 text-xs font-medium bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
                                                    <Check className="w-4 h-4 mr-1" /> Uploaded
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {formData.type === AssetType.YACHT ? 'Upload vessel registration or license documents.' :
                                                formData.type === AssetType.PLANE || formData.type === AssetType.HELICOPTER ? 'Upload aircraft registration or airworthiness certificate.' :
                                                    'Upload vehicle registration or insurance papers (PDF/Image).'}
                                        </p>
                                    </div>
                                )}



                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                {/* Specs Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Capacity</label>
                                        <input
                                            type="number"
                                            placeholder="4"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Speed (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 200 km/h"
                                            value={formData.speed}
                                            onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1"><Fuel className="w-3 h-3" /> Fuel Type</label>
                                        <div className="relative">
                                            <select
                                                value={formData.fuelType}
                                                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white transition-all appearance-none"
                                            >
                                                <option value="">Select...</option>
                                                {FUEL_TYPES[formData.type]?.map(fuel => (
                                                    <option key={fuel} value={fuel}>{fuel}</option>
                                                ))}
                                            </select>
                                            <ChevronRight className="w-4 h-4 absolute right-3 top-3 text-slate-400 rotate-90 pointer-events-none" />
                                        </div>
                                    </div>

                                    {showTransmission && (
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1"><Settings2 className="w-3 h-3" /> Transmission</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.transmission}
                                                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white transition-all appearance-none"
                                                >
                                                    <option value="">Select...</option>
                                                    <option value="Automatic">Automatic</option>
                                                    <option value="Manual">Manual</option>
                                                </select>
                                                <ChevronRight className="w-4 h-4 absolute right-3 top-3 text-slate-400 rotate-90 pointer-events-none" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Maintenance */}
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center">
                                        <Wrench className="w-4 h-4 mr-2 text-slate-500" />
                                        Maintenance Tracking (Internal Use)
                                    </h4>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Next Service Date</label>
                                            <input
                                                type="date"
                                                value={formData.nextServiceDate}
                                                onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })}
                                                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white text-sm"
                                            />
                                        </div>
                                        <div className="flex items-end pb-2">
                                            <p className="text-xs text-slate-400 leading-tight">
                                                We'll remind you when this date approaches to keep your fleet in top condition.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Personnel for Convoy */}
                                {formData.type === AssetType.CONVOY && (
                                    <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                                        <h4 className="text-sm font-bold text-white mb-4 flex items-center">
                                            <ShieldCheck className="w-4 h-4 mr-2 text-green-500" />
                                            Security Personnel
                                        </h4>
                                        <div className="space-y-4">
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.securityFeatures.included}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        securityFeatures: { ...formData.securityFeatures, included: e.target.checked }
                                                    })}
                                                    className="w-4 h-4 rounded border-slate-600 text-green-500 focus:ring-green-500 bg-slate-800"
                                                />
                                                <span className="ml-2 text-sm text-slate-300">Include Security Personnel</span>
                                            </label>

                                            {formData.securityFeatures.included && (
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                                                    <div>
                                                        <label className="text-xs text-slate-400 mb-1 block">Personnel Count</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={formData.securityFeatures.count || ''}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                securityFeatures: { ...formData.securityFeatures, count: parseInt(e.target.value) }
                                                            })}
                                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-400 mb-1 block">Type</label>
                                                        <select
                                                            value={formData.securityFeatures.type || ''}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                securityFeatures: { ...formData.securityFeatures, type: e.target.value }
                                                            })}
                                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                                                        >
                                                            <option value="">Select Type</option>
                                                            <option value="Police Escort">Police Escort</option>
                                                            <option value="Private Security">Private Security</option>
                                                            <option value="Military Escort">Military Escort</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center pt-5">
                                                        <label className="flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.securityFeatures.armed || false}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    securityFeatures: { ...formData.securityFeatures, armed: e.target.checked }
                                                                })}
                                                                className="w-4 h-4 rounded border-slate-600 text-red-500 focus:ring-red-500 bg-slate-800"
                                                            />
                                                            <span className="ml-2 text-sm text-slate-300">Armed</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Features Selection */}
                                <div className="pt-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3">
                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                        Features & Amenities
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {ASSET_FEATURES[formData.type]?.map((feature) => {
                                            const isSelected = formData.features.includes(feature);
                                            return (
                                                <button
                                                    key={feature}
                                                    type="button"
                                                    onClick={() => toggleFeature(feature)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isSelected
                                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
                                                        }`}
                                                >
                                                    {feature}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {formData.features.length === 0 && (
                                        <p className="text-xs text-slate-400 mt-2 italic">Tap to add amenities available in your {formData.type.toLowerCase()}.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Asset Gallery <span className="text-red-500">*</span></label>

                                    {/* Gallery Grid */}
                                    {gallery.length > 0 && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            {gallery.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`relative group rounded-xl overflow-hidden aspect-square border-2 transition-all ${idx === coverIndex
                                                        ? 'border-green-500 ring-2 ring-green-500 ring-offset-2 dark:ring-offset-slate-900'
                                                        : 'border-slate-200 dark:border-slate-700'
                                                        }`}
                                                    onClick={() => setCoverIndex(idx)}
                                                >
                                                    <img src={item.preview} alt={`Upload ${idx}`} className="w-full h-full object-cover" />

                                                    {/* Cover Badge */}
                                                    {idx === coverIndex && (
                                                        <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                                                            <Star className="w-3 h-3 fill-white" /> Feature
                                                        </div>
                                                    )}

                                                    {/* Hover Actions */}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        {idx !== coverIndex && (
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); setCoverIndex(idx); }} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm" title="Set as Cover">
                                                                <ImageIcon className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(idx); }} className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white backdrop-blur-sm" title="Remove">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Upload Trigger (Mini) if images exist */}
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-red-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors aspect-square"
                                            >
                                                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                                                <span className="text-xs text-slate-500 font-medium">Add More</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Large Upload Zone (if empty) */}
                                    {gallery.length === 0 && (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group border-slate-300 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:scale-110 transition-transform">
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                                                Click to upload images
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                JPG, PNG, GIF (Max 5MB per file)
                                            </p>
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        multiple
                                    />
                                    {gallery.length > 0 && <p className="text-xs text-slate-500 mt-2">Tip: Click an image to set it as the cover/feature image.</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                                    <textarea
                                        rows={6}
                                        required
                                        placeholder="Describe your asset, special features, usage rules, and what makes it unique..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white resize-none transition-all"
                                    />
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        By listing this asset, you confirm that you have the legal right to rent it out and that it meets all safety regulations.
                                    </p>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between">
                    <Button variant="ghost" type="button" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
                        {step === 1 ? 'Cancel' : <><ChevronLeft className="w-4 h-4 mr-1" /> Back</>}
                    </Button>

                    {step < 4 ? (
                        <Button type="button" onClick={handleNext} className="group">
                            Next Step <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={(e) => handleSubmit(e as any)}
                            disabled={!formData.description || gallery.length === 0 || isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {initialData ? 'Updating...' : 'List Asset'}
                                </>
                            ) : (initialData ? 'Update Asset' : 'List Asset')}
                        </Button>
                    )}
                </div>
            </div>

            <CustomAlertModal
                isOpen={alertData.isOpen}
                onClose={() => setAlertData({ ...alertData, isOpen: false })}
                title={alertData.title}
                message={alertData.message}
                type={alertData.type}
            />
        </div>,
        document.body
    );
};
