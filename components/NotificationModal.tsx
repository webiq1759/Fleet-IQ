
import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Button } from './Button';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
  type?: 'success' | 'error' | 'info';
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  buttonText = 'OK',
  type = 'success'
}) => {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle className="w-8 h-8" />,
    error: <AlertCircle className="w-8 h-8" />,
    info: <Info className="w-8 h-8" />
  };

  const colors = {
    success: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 p-8 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${colors[type]}`}>
            {icons[type]}
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-sm">
            {message}
        </p>
        <Button onClick={onClose} fullWidth size="lg">
            {buttonText}
        </Button>
      </div>
    </div>,
    document.body
  );
};
