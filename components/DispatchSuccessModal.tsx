import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, Truck, User, Calendar, X } from 'lucide-react';
import { Button } from './Button';

interface DispatchSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        assetTitle: string;
        crewName: string;
        pickupDate: string;
        pickupTime: string;
    } | null;
}

export const DispatchSuccessModal: React.FC<DispatchSuccessModalProps> = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">

                {/* Header Pattern */}
                <div className="h-24 bg-gradient-to-br from-green-500 to-emerald-600 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg transform translate-y-8">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                </div>

                <div className="pt-12 pb-6 px-6 text-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        Dispatch Successful
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        Crew has been assigned and the asset is ready for deployment.
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 text-left border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Truck className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Asset</p>
                                <p className="font-semibold text-slate-900 dark:text-white text-sm">{data.assetTitle}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <User className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Crew Assigned</p>
                                <p className="font-semibold text-slate-900 dark:text-white text-sm">{data.crewName}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Schedule</p>
                                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                    {data.pickupDate} <span className="text-slate-400 mx-1">•</span> {data.pickupTime}
                                </p>
                            </div>
                        </div>


                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                    <Button onClick={onClose} fullWidth className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90">
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
