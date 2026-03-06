import React, { useState } from 'react';
import { SitemapModal } from './SitemapModal';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { usePWA } from '../contexts/PWAContext';

export const Footer = () => {
    const [isSitemapOpen, setIsSitemapOpen] = useState(false);
    const { deferredPrompt, isAppInstalled, installApp } = usePWA();

    return (
        <>
            <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-12 pb-32 md:pb-12 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="flex items-center justify-center mb-4">
                        <img src="/logo.png" alt="Fleet IQ Logo" className="w-6 h-6 mr-2" />
                        <span className="font-bold text-slate-900 dark:text-white">Fleet IQ</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        © 2026 Fleet IQ. The Enterprise Transportation Marketplace.
                    </p>
                    <div className="flex justify-center space-x-6 mt-4 text-sm text-slate-500 dark:text-slate-400">
                        <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms</Link>
                        <button
                            onClick={() => setIsSitemapOpen(true)}
                            className="hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Sitemap
                        </button>
                        {deferredPrompt ? (
                            <button
                                onClick={installApp}
                                className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors text-red-600 dark:text-red-400 font-medium"
                            >
                                <Download className="w-4 h-4" />
                                Install App
                            </button>
                        ) : (
                            // Debug only: remove later
                            <span className="text-xs text-slate-300">
                                {isAppInstalled ? 'App Installed' : 'Install Unavailable (Check Browser)'}
                            </span>
                        )}
                    </div>
                </div>
            </footer>

            <SitemapModal isOpen={isSitemapOpen} onClose={() => setIsSitemapOpen(false)} />
        </>
    );
};
