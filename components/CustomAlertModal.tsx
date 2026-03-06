import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './Button';

interface CustomAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning';
}

export const CustomAlertModal: React.FC<CustomAlertModalProps> = ({ isOpen, onClose, title, message, type = 'error' }) => {
    if (!isOpen) return null;

    const Icon = type === 'success' ? CheckCircle : type === 'warning' ? AlertCircle : XCircle;
    const iconColor = type === 'success' ? 'text-green-500' : type === 'warning' ? 'text-amber-500' : 'text-red-500';

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800 mb-4">
                        <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>

                    <Button onClick={onClose} className="w-full">
                        Okay
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
