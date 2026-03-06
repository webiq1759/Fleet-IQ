import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SitemapModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SitemapModal: React.FC<SitemapModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleNavigation = (path: string) => {
        navigate(path);
        onClose();
    };

    const sections = [
        {
            title: 'Marketplace',
            links: [
                { label: 'Browse All Fleets', path: '/' },
                { label: 'Vehicles', path: '/?category=Vehicles' },
                { label: 'Yachts', path: '/?category=Yachts' },
                { label: 'Aircraft', path: '/?category=Aircraft' },
                { label: 'Trucks', path: '/?category=Trucks' },
            ]
        },
        {
            title: 'Hosting',
            links: [
                { label: 'List Your Fleet', path: '/onboarding' },
                { label: 'Host Dashboard', path: '/' }, // Toggles mode logic handles this on main page or check auth
                { label: 'Why Host?', path: '/onboarding' },
            ]
        },
        {
            title: 'Support',
            links: [
                { label: 'Help Center', path: '/help' },
                { label: 'Contact Support', path: '/help' },
                { label: 'Safety Information', path: '/help' },
            ]
        },
        {
            title: 'Legal',
            links: [
                { label: 'Privacy Policy', path: '/privacy' },
                { label: 'Terms of Service', path: '/terms' },
                { label: 'Lister Agreement', path: '/lister-agreement' },
                { label: 'Cookie Policy', path: '/privacy' },
            ]
        },
        {
            title: 'Account',
            links: [
                { label: 'Login', path: '/login' },
                { label: 'Sign Up', path: '/signup' },
                { label: 'My Bookings', path: '/account/trips' },
                { label: 'Invite & Earn', path: '/account/settings' },
            ]
        },
        {
            title: 'Developers',
            links: [
                { label: 'API Documentation', path: '/developer' },
                { label: 'Status Page', path: '#' },
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sitemap</h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-8">
                        {sections.map((section) => (
                            <div key={section.title}>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                                    {section.title}
                                </h3>
                                <ul className="space-y-3">
                                    {section.links.map((link) => (
                                        <li key={link.label}>
                                            <button
                                                onClick={() => handleNavigation(link.path)}
                                                className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:underline transition-colors text-sm flex items-center group"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mr-2 group-hover:bg-red-500 transition-colors"></span>
                                                {link.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">© 2026 Fleet IQ. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};
