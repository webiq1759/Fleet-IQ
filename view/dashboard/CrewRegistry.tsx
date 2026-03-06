import React, { useEffect } from 'react';
import { User, ShieldCheck, Calendar, Briefcase, Plane, Car, Anchor, Truck, Disc, Trash2, Edit } from 'lucide-react';
import { CrewMember, AssetType, Asset } from '../../types';
import { supabase } from '../../supabaseClient';

interface CrewRegistryProps {
    crew: CrewMember[];
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    availableFleets: Asset[];
}

const CrewCard = ({
    member,
    onEdit,
    onDelete,
    getIconForType,
    getAssignedAssetNames
}: {
    member: CrewMember;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    getIconForType: (type: AssetType) => JSX.Element;
    getAssignedAssetNames: (ids: string[] | string | null | undefined) => string;
}) => {
    const [showMore, setShowMore] = React.useState(false);

    // Calculate Expiry Status
    const getExpiryStatus = (dateStr?: string) => {
        if (!dateStr) return { label: 'No Date', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' };

        const expiry = new Date(dateStr);
        const now = new Date();
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'Expired', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800' };
        if (diffDays <= 30) return { label: `Expiring in ${diffDays} days`, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800' };
        return { label: `Expires ${expiry.toLocaleDateString()}`, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800' };
    };

    const expiryStatus = getExpiryStatus(member.expiryDate);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow group relative flex flex-col h-full">
            {/* Header / Banner */}
            <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-800 dark:to-black relative shrink-0">
                <div className="absolute top-3 right-3">
                    {(() => {
                        const statusColors = {
                            'Active': 'bg-green-500/20 text-green-400 border-green-500/30',
                            'Busy': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                            'Pending': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                            'Rejected': 'bg-red-500/20 text-red-400 border-red-500/30',
                            'Inactive': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
                            'On Leave': 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                        };
                        // The database ENUM is Title Case, so this key lookup works directly.
                        const colorClass = statusColors[member.status as keyof typeof statusColors] || statusColors.Inactive;
                        return (
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
                                {member.status}
                            </span>
                        );
                    })()}
                </div>
            </div>

            {/* Avatar & Info */}
            <div className="px-6 pb-6 relative flex-1 flex flex-col">
                <div className="w-20 h-20 rounded-xl border-4 border-white dark:border-slate-900 shadow-lg -mt-10 mb-4 overflow-hidden bg-slate-200 shrink-0">
                    <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" onError={(e) => {
                        e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + member.name + '&background=random';
                    }} />
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{member.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{member.email}</p>
                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {getIconForType(member.assetType)}
                        <span className="ml-2">{member.role}</span>
                    </div>
                </div>

                {/* Expiry Alert */}
                {member.expiryDate && (
                    <div className={`mb-4 px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-between ${expiryStatus.bg}`}>
                        <span className={`${expiryStatus.color} font-bold`}>License:</span>
                        <span className={`${expiryStatus.color}`}>{expiryStatus.label}</span>
                    </div>
                )}

                {/* License / Details */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 flex-1">
                    <div className="flex items-start">
                        <ShieldCheck className="w-4 h-4 text-slate-400 mt-0.5 mr-2 shrink-0" />
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold">License No.</p>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{member.licenseNumber}</p>
                        </div>
                    </div>

                    {/* Collapsible Details */}
                    {showMore && (
                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-start">
                                <Briefcase className="w-4 h-4 text-slate-400 mt-0.5 mr-2 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold">Experience</p>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{member.yearsExperience} Years</p>
                                </div>
                            </div>
                            {member.phone && (
                                <div className="flex items-start">
                                    <span className="w-4 h-4 flex items-center justify-center mr-2 text-slate-400 text-xs mt-0.5">📞</span>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold">Phone</p>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {member.phone.startsWith('234') ? '0' + member.phone.slice(3) : (member.phone.length === 10 ? '0' + member.phone : member.phone)}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {member.whatsapp_number && (
                                <div className="flex items-start">
                                    <span className="w-4 h-4 flex items-center justify-center mr-2 text-slate-400 text-xs mt-0.5">💬</span>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold">WhatsApp</p>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {member.whatsapp_number.startsWith('234') ? '0' + member.whatsapp_number.slice(3) : (member.whatsapp_number.length === 10 ? '0' + member.whatsapp_number : member.whatsapp_number)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg mt-2">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Assigned To:</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-2">
                            {getAssignedAssetNames(member.assignedAssetIds || member.assignedAssetId)}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowMore(!showMore)}
                    className="w-full mt-4 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center justify-center gap-1"
                >
                    {showMore ? 'Show Less' : 'Show More Details'}
                </button>
            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between shrink-0">
                <button onClick={() => onEdit(member.id)} className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
                    <Edit className="w-3 h-3" /> Edit Profile
                </button>
                <button onClick={() => onDelete(member.id)} className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Remove
                </button>
            </div>
        </div>
    );
};

export const CrewRegistry: React.FC<CrewRegistryProps> = ({ crew, onDelete, onEdit, availableFleets }) => {

    // Helper to get asset names
    const getAssignedAssetNames = (assignedIds: string[] | string | null | undefined): string => {
        if (!assignedIds) return "No Asset Assigned";
        const ids = Array.isArray(assignedIds) ? assignedIds : [assignedIds as string];
        const names = ids.map(id => {
            const asset = availableFleets.find(f => f.id === id);
            return asset ? asset.title : "Unknown Asset";
        }).filter(n => n !== "Unknown Asset");
        if (names.length === 0) return "No Asset Assigned";
        return names.join(", ");
    };

    const getIconForType = (type: AssetType) => {
        switch (type) {
            case AssetType.PLANE: return <Plane className="w-4 h-4" />;
            case AssetType.VEHICLE: return <Car className="w-4 h-4" />;
            case AssetType.YACHT: return <Anchor className="w-4 h-4" />;
            case AssetType.TRUCK: return <Truck className="w-4 h-4" />;
            case AssetType.HELICOPTER: return <Disc className="w-4 h-4" />;
            default: return <User className="w-4 h-4" />;
        }
    };

    // Chunk crew into groups of 8 for mobile
    const chunkArr = (arr: CrewMember[], size: number) => {
        return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
            arr.slice(i * size, i * size + size)
        );
    };

    const crewChunks = chunkArr(crew, 8);

    return (
        <div className="space-y-6 pb-24 md:pb-0">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Crew</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Qualified personnel managing your fleet assets.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Crew:</span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-900 dark:text-white font-bold">{crew.length}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {crewChunks.length > 0 ? (
                    crewChunks.map((chunk, i) => (
                        <div key={i} className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6 md:pb-0 md:overflow-visible">
                            {chunk.map((member) => (
                                <div key={member.id} className="min-w-[80%] w-[80%] snap-center shrink-0 md:w-auto md:min-w-0 h-full">
                                    <CrewCard
                                        member={member}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        getIconForType={getIconForType}
                                        getAssignedAssetNames={getAssignedAssetNames}
                                    />
                                </div>
                            ))}
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Crew Members Found</h3>
                        <p className="text-slate-500 dark:text-slate-400">Add your first crew member to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
