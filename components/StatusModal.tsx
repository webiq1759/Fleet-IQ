import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, X, Truck, User, Calendar } from 'lucide-react';
import { Button } from './Button';

interface StatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'success' | 'error';
    title: string;
    message: string;
    data?: {
        assetTitle: string;
        crewName: string;
        pickupDate: string;
        pickupTime: string;
    };
}

export const StatusModal: React.FC<StatusModalProps> = ({ isOpen, onClose, type, title, message, data }) => {
    if (!isOpen) return null;

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
                <div className={`h-24 relative overflow-hidden flex items-center justify-center ${type === 'success'
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                        : 'bg-gradient-to-br from-red-500 to-rose-600'
                    }`}>
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg transform translate-y-8">
                        {type === 'success' ? (
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        ) : (
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        )}
                    </div>
                </div>

                <div className="pt-12 pb-6 px-6 text-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        {message}
                    </p>

                    {type === 'success' && data && (
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
                    )}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                    <Button onClick={onClose} fullWidth className={`text-white hover:opacity-90 ${type === 'success' ? 'bg-slate-900 dark:bg-white dark:text-slate-900' : 'bg-red-600'
                        }`}>
                        {type === 'success' ? 'Return to Dashboard' : 'Close and Retry'}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
