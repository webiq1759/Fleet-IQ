
import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Bug, X, Lightbulb, Upload } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../supabaseClient';

interface ReportIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        type: 'Bug Report',
        title: '',
        description: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase.from('tickets').insert({
                user_id: user.id,
                subject: formData.title,
                description: formData.description,
                type: formData.type, // 'Bug Report' or 'Feature Request'
                status: 'Open',
                urgency: 'Normal', // Default
                category: isBugObj ? 'Technical' : 'Feature'
            });

            if (error) throw error;

            alert(`Thank you for your feedback! We've received your ${formData.type.toLowerCase()}.`);
            onClose();
            setFormData({ type: 'Bug Report', title: '', description: '' });
        } catch (error: any) {
            console.error('Error submitting report:', error);
            alert('Failed to submit report: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isBugObj = formData.type === 'Bug Report';

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl transition-all">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        {isBugObj ? <Bug className="w-5 h-5 text-red-500" /> : <Lightbulb className="w-5 h-5 text-amber-500" />}
                                        Report Issue
                                    </h3>
                                    <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                                    <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'Bug Report' })}
                                            className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${isBugObj
                                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                        >
                                            Bug Report
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'Feature Request' })}
                                            className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${!isBugObj
                                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                        >
                                            Feature Request
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder={isBugObj ? "e.g., App crashes when I click 'Book'" : "e.g., Add Dark Mode support"}
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                                        <textarea
                                            rows={4}
                                            required
                                            placeholder={isBugObj ? "Please describe the steps to reproduce the issue..." : "How would this feature help you?"}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Attachments (Optional)</label>
                                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                            <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600 group-hover:text-purple-500 mb-2 transition-colors" />
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Click to upload or drag and drop</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-end gap-3">
                                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
