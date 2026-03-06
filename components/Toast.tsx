
import React, { useEffect } from 'react';
import { X, CheckCircle, Info, AlertCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  return (
    <div className="flex items-start w-full max-w-md min-w-[300px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden p-4 mb-3 animate-in slide-in-from-right fade-in duration-300">
      <div className="flex-shrink-0">
        {icons[toast.type]}
      </div>
      <div className="ml-3 w-0 flex-1 pt-0.5">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{toast.title}</p>
        {toast.message && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{toast.message}</p>
        )}
      </div>
      <div className="ml-4 flex-shrink-0 flex">
        <button
          className="bg-white dark:bg-slate-800 rounded-md inline-flex text-slate-400 hover:text-slate-500 focus:outline-none"
          onClick={() => onClose(toast.id)}
        >
          <span className="sr-only">Close</span>
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC<{ toasts: ToastMessage[], removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed z-[100] flex flex-col gap-2 pointer-events-none top-4 left-4 right-4 items-center sm:top-24 sm:right-6 sm:left-auto sm:items-end sm:w-auto">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onClose={removeToast} />
      ))}
    </div>
  );
};
