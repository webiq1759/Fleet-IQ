import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Check, User, ShieldCheck, FileText, AlertCircle, Loader2, Search } from 'lucide-react';
import { Button } from './Button';
import { AssetType, Asset, CrewMember } from '../types';
import { supabase } from '../supabaseClient';
import { Toast } from './Toast';

interface AddCrewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (crew: any) => void;
    availableAssets: Asset[];
    initialData?: CrewMember | null;
}

export const AddCrewModal: React.FC<AddCrewModalProps> = ({ isOpen, onClose, onAdd, availableAssets, initialData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const idInputRef = useRef<HTMLInputElement>(null);
    const licenseInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        whatsapp: '',
        role: '',
        assetType: AssetType.VEHICLE,
        licenseNumber: '',
        licenseType: '',
        expiryDate: '',
        yearsExperience: '',
        assignedAssetIds: [] as string[],
        photo: null as File | null,
        identityDoc: null as File | null,
        licenseDoc: null as File | null
    });

    const [searchQuery, setSearchQuery] = useState(''); // State for search
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Filter assets based on search query AND asset type
    // Filter assets based on search query AND asset type
    // Update: Allow CONVOY assets to appear when VEHICLE is selected
    const filteredAssets = availableAssets.filter(asset =>
        (asset.type === formData.assetType || (formData.assetType === AssetType.VEHICLE && asset.type === AssetType.CONVOY)) &&
        (asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    useEffect(() => {
        if (isOpen && initialData) {
            // Populate form for editing
            const splitName = initialData.name.split(' ');
            setFormData({
                firstName: splitName[0] || '',
                lastName: splitName.slice(1).join(' ') || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                whatsapp: initialData.whatsapp_number || '', // Mapped correctly from DB column if needed, though type says 'whatsapp' not in interface? Wait, interface has phone. Let's check payload. Payload has whatsapp_number.
                role: initialData.role || '',
                assetType: initialData.assetType,
                licenseNumber: initialData.licenseNumber || '',
                licenseType: initialData.licenseType || '',
                expiryDate: initialData.expiryDate || '',
                yearsExperience: initialData.yearsExperience?.toString() || '',
                assignedAssetIds: initialData.assignedAssetIds || (initialData.assignedAssetId ? [initialData.assignedAssetId] : []),
                photo: null,
                identityDoc: null,
                licenseDoc: null
            });
            setAvatarPreview(initialData.avatarUrl || null);
        } else if (isOpen && !initialData) {
            // Reset form
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                whatsapp: '',
                role: '',
                assetType: AssetType.VEHICLE,
                licenseNumber: '',
                licenseType: '',
                expiryDate: '',
                yearsExperience: '',
                assignedAssetIds: [],
                photo: null,
                identityDoc: null,
                licenseDoc: null
            });
            setAvatarPreview(null);
            setSearchQuery('');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const uploadFile = async (file: File, path: string) => {
        const { data, error } = await supabase.storage
            .from('crew-documents')
            .upload(path, file);
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('crew-documents')
            .getPublicUrl(path);

        return publicUrl;
    };

    const toggleAssetAssignment = (assetId: string) => {
        setFormData(prev => {
            const currentIds = prev.assignedAssetIds || [];
            if (currentIds.includes(assetId)) {
                return { ...prev, assignedAssetIds: currentIds.filter(id => id !== assetId) };
            } else {
                return { ...prev, assignedAssetIds: [...currentIds, assetId] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Determine Avatar URL
            let avatarUrl = initialData?.avatarUrl || 'https://ui-avatars.com/api/?name=' + formData.firstName + '+' + formData.lastName + '&background=random';

            const timestamp = Date.now();

            if (formData.photo) {
                // New photo uploaded
                const cleanName = formData.photo.name.replace(/[^a-zA-Z0-9.]/g, '_');
                avatarUrl = await uploadFile(formData.photo, `${user.id}/${timestamp}_avatar_${cleanName}`);
            }

            // 2. Handle Documents (Preserve existing if not updated)
            const documents: any = initialData?.documents || {};

            if (formData.identityDoc) {
                const cleanName = formData.identityDoc.name.replace(/[^a-zA-Z0-9.]/g, '_');
                documents.identity = await uploadFile(formData.identityDoc, `${user.id}/${timestamp}_id_${cleanName}`);
            }

            if (formData.licenseDoc) {
                const cleanName = formData.licenseDoc.name.replace(/[^a-zA-Z0-9.]/g, '_');
                documents.license = await uploadFile(formData.licenseDoc, `${user.id}/${timestamp}_license_${cleanName}`);
            }

            // Sanitize status to only valid enum values
            let safeStatus = initialData ? initialData.status : 'Pending';
            const validStatuses = ['Pending', 'Active', 'Rejected', 'Busy', 'On Leave'];
            if (safeStatus === 'Approved') safeStatus = 'Active';
            if (!validStatuses.includes(safeStatus as string)) safeStatus = 'Active';

            // 3. Prepare Payload
            const crewPayload = {
                owner_id: user.id,
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                phone: formData.phone,
                whatsapp_number: formData.whatsapp,
                role: formData.role || getRoleForAssetType(formData.assetType),
                asset_type: formData.assetType,
                license_number: formData.licenseNumber,
                license_type: formData.licenseType || getLicenseLabel(formData.assetType),
                years_experience: Number(formData.yearsExperience) || 0,
                expiry_date: formData.expiryDate || null,
                status: safeStatus,
                avatar_url: avatarUrl,
                assigned_asset_ids: formData.assignedAssetIds,
                documents: documents
            };

            let resultData;

            if (initialData) {
                // UPDATE
                const { data, error: dbError } = await supabase
                    .from('crew_members')
                    .update(crewPayload)
                    .eq('id', initialData.id)
                    .select()
                    .single();

                if (dbError) throw dbError;
                resultData = data;
            } else {
                // INSERT
                const { data, error: dbError } = await supabase
                    .from('crew_members')
                    .insert(crewPayload)
                    .select()
                    .single();

                if (dbError) throw dbError;
                resultData = data;
            }

            // 4. Update UI - Map back to CamelCase for Frontend
            const uiUpdate: CrewMember = {
                id: resultData.id,
                ownerId: crewPayload.owner_id,
                name: crewPayload.name,
                email: crewPayload.email,
                phone: crewPayload.phone,
                whatsapp_number: crewPayload.whatsapp_number, // Ensure type allows this or map to phone/whatsapp if needed
                role: crewPayload.role,
                assetType: crewPayload.asset_type,
                licenseNumber: crewPayload.license_number,
                licenseType: crewPayload.license_type,
                yearsExperience: crewPayload.years_experience,
                expiryDate: crewPayload.expiry_date || undefined,
                status: crewPayload.status as any,
                avatarUrl: crewPayload.avatar_url,
                assignedAssetIds: crewPayload.assigned_asset_ids,
                documents: crewPayload.documents
            };

            onAdd(uiUpdate);

            resetForm();
            onClose();

        } catch (err: any) {
            console.error('Error saving crew:', err);
            setError(err.message || 'Failed to save crew member');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            whatsapp: '',
            role: '',
            assetType: AssetType.VEHICLE,
            licenseNumber: '',
            licenseType: '',
            expiryDate: '',
            yearsExperience: '',
            assignedAssetIds: [],
            photo: null,
            identityDoc: null,
            licenseDoc: null
        });
        setAvatarPreview(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'photo' | 'identityDoc' | 'licenseDoc') => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, [field]: e.target.files[0] });
            if (field === 'photo') {
                // Update preview immediately for new file
                setAvatarPreview(URL.createObjectURL(e.target.files[0]));
            }
        }
    };

    const getLicenseLabel = (type: AssetType) => {
        switch (type) {
            case AssetType.PLANE: return "Pilot License (ATPL/CPL)";
            case AssetType.HELICOPTER: return "Rotary Wing Pilot License";
            case AssetType.YACHT: return "Captain's License (STCW/Master)";
            case AssetType.TRUCK: return "Heavy Duty License (CDL)";
            case AssetType.CONVOY: return "Security Driving License / Permit";
            default: return "Driver's License / Chauffeur Permit";
        }
    };

    const getRoleForAssetType = (type: AssetType) => {
        switch (type) {
            case AssetType.PLANE: return "Pilot";
            case AssetType.HELICOPTER: return "Pilot";
            case AssetType.YACHT: return "Captain";
            case AssetType.TRUCK: return "Driver";
            case AssetType.CONVOY: return "Lead Driver / Security";
            default: return "Chauffeur";
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{initialData ? 'Edit Crew Member' : 'Add New Crew Member'}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Register qualified personnel. Pending approval.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <div className="overflow-y-auto flex-1 p-6">
                    <form id="add-crew-form" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Photo Upload */}
                            <div className="md:col-span-1 space-y-4">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-red-500 transition-colors relative overflow-hidden group"
                                >
                                    {formData.photo ? (
                                        <img src={URL.createObjectURL(formData.photo)} alt="Preview" className="w-full h-full object-cover" />
                                    ) : avatarPreview ? (
                                        <img src={avatarPreview} alt="Current Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <User className="w-12 h-12 text-slate-400 mb-2" />
                                            <span className="text-xs text-slate-500 text-center px-2">Upload Profile Photo</span>
                                        </>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="w-6 h-6 text-white" />
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e, 'photo')}
                                        accept="image/*"
                                    />
                                </div>
                                {!formData.photo && !avatarPreview && <p className="text-xs text-center text-slate-500">Not the ID card. Actual photo.</p>}
                            </div>

                            {/* Details */}
                            <div className="md:col-span-2 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address <span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="crew@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number <span className="text-red-500">*</span></label>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="+234..."
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp (Optional)</label>
                                        <input
                                            type="tel"
                                            placeholder="+234..."
                                            value={formData.whatsapp}
                                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                {/* Asset Assignment Section */}
                                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Asset Assignment</h4>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500 uppercase">Category</label>
                                        <select
                                            value={formData.assetType}
                                            onChange={(e) => setFormData({ ...formData, assetType: e.target.value as AssetType, assignedAssetIds: [] })}
                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                                            disabled={!!initialData} // Disable changing type on edit to avoid mismatches
                                        >
                                            {Object.values(AssetType).map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-500 uppercase">Assign Assets</label>

                                        {/* Multi-Select Container */}
                                        <div className="space-y-2">
                                            {/* Selected Chips */}
                                            {formData.assignedAssetIds.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {formData.assignedAssetIds.map(id => {
                                                        const asset = availableAssets.find(a => a.id === id);
                                                        return (
                                                            <div key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30">
                                                                <span className="max-w-[150px] truncate">{asset?.title || 'Unknown Fleet'}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleAssetAssignment(id)}
                                                                    className="hover:bg-red-200 dark:hover:bg-red-800 rounded-full p-0.5 transition-colors"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Search & Dropdown */}
                                            <div className="relative group">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        placeholder={formData.assignedAssetIds.length > 0 ? "Add more..." : "Search to assign..."}
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                                                    />
                                                </div>

                                                {/* Dropdown Results - Show when searching or focused (using group-focus-within would be ideal, but simple check here) */}
                                                {searchQuery && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {filteredAssets.length > 0 ? (
                                                            filteredAssets.map(asset => {
                                                                const isSelected = formData.assignedAssetIds.includes(asset.id);
                                                                return (
                                                                    <button
                                                                        key={asset.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (!isSelected) toggleAssetAssignment(asset.id);
                                                                            setSearchQuery(''); // Clear search on select
                                                                        }}
                                                                        disabled={isSelected}
                                                                        className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${isSelected
                                                                            ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 cursor-default'
                                                                            : 'hover:bg-red-50 dark:hover:bg-red-900/10 text-slate-900 dark:text-white'
                                                                            }`}
                                                                    >
                                                                        <span className="truncate">{asset.title}</span>
                                                                        {isSelected && <Check className="w-3 h-3 text-slate-400" />}
                                                                    </button>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="p-3 text-center text-xs text-slate-500">No matching assets found</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-500 text-right">
                                                Showing matches for "{searchQuery || '...'}"
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Credentials & Documents Section */}
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4">
                                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                                        <ShieldCheck className="w-4 h-4 mr-2 text-green-600" />
                                        Credentials & Documents
                                    </h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">License Number <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="License No."
                                                value={formData.licenseNumber}
                                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Experience (Yrs)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="e.g. 5"
                                                value={formData.yearsExperience}
                                                onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                                                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">License Expiry Date <span className="text-red-500">*</span></label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.expiryDate}
                                            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                                        />
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <div
                                            onClick={() => idInputRef.current?.click()}
                                            className={`p-3 border border-dashed rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${formData.identityDoc ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-800' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-red-400'}`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                {formData.identityDoc ? <Check className="w-4 h-4 text-green-600" /> : <FileText className="w-4 h-4 text-slate-400" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                    {formData.identityDoc ? formData.identityDoc.name : 'Upload Identification (ID/Passport)'}
                                                </p>
                                                {!formData.identityDoc && <p className="text-xs text-slate-500">Required for verification</p>}
                                            </div>
                                            <input type="file" ref={idInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'identityDoc')} />
                                        </div>

                                        <div
                                            onClick={() => licenseInputRef.current?.click()}
                                            className={`p-3 border border-dashed rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${formData.licenseDoc ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-800' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-red-400'}`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                {formData.licenseDoc ? <Check className="w-4 h-4 text-green-600" /> : <ShieldCheck className="w-4 h-4 text-slate-400" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                    {formData.licenseDoc ? formData.licenseDoc.name : `Upload ${getLicenseLabel(formData.assetType)}`}
                                                </p>
                                                {!formData.licenseDoc && <p className="text-xs text-slate-500">Required for verification</p>}
                                            </div>
                                            <input type="file" ref={licenseInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'licenseDoc')} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div >
                    </form >
                </div >

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button
                        onClick={(e) => handleSubmit(e as any)}
                        disabled={
                            !formData.firstName ||
                            !formData.lastName ||
                            !formData.email ||
                            !formData.licenseNumber ||
                            formData.assignedAssetIds.length === 0 ||
                            (!initialData && (!formData.identityDoc || !formData.licenseDoc)) || // Require docs only for new crew
                            isSubmitting
                        }
                    >
                        {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : (initialData ? 'Update Records' : 'Submit for Approval')}
                    </Button>
                </div>
            </div >
        </div >,
        document.body
    );
};