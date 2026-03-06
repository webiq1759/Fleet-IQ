import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { CURRENCIES, LANGUAGES } from '../constants';

interface PreferencesModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'language' | 'currency';
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({ isOpen, onClose, initialTab = 'currency' }) => {
    const { currency, language, setCurrency, setLanguage } = usePreferences();
    const [activeTab, setActiveTab] = useState<'language' | 'currency'>(initialTab);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-colors duration-200">

                {/* Header with Tabs */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <button onClick={onClose} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>

                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('language')}
                            className={`text-sm font-semibold pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'language' ? 'text-slate-900 dark:text-white border-slate-900 dark:border-white' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Language and region
                        </button>
                        <button
                            onClick={() => setActiveTab('currency')}
                            className={`text-sm font-semibold pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'currency' ? 'text-slate-900 dark:text-white border-slate-900 dark:border-white' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Currency
                        </button>
                    </div>

                    <div className="w-9" /> {/* Spacer for centering */}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                        {activeTab === 'language' ? 'Choose a language and region' : 'Choose a currency'}
                    </h2>

                    {activeTab === 'language' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => setLanguage(lang.code)}
                                    className={`text-left p-3 rounded-lg transition-all ${language.code === lang.code
                                            ? 'bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-900 dark:ring-white'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{lang.name}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">{lang.region}</div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {CURRENCIES.map((curr) => (
                                <button
                                    key={curr.code}
                                    onClick={() => setCurrency(curr.code)}
                                    className={`text-left p-3 rounded-lg transition-all ${currency.code === curr.code
                                            ? 'bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-900 dark:ring-white'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{curr.name}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">{curr.code} – {curr.symbol}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
