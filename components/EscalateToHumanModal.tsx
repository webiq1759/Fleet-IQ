
import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { User, X, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

interface EscalateToHumanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EscalateToHumanModal: React.FC<EscalateToHumanModalProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        subject: '',
        category: 'Booking',
        urgency: 'Medium',
        description: '',
        contactPreference: 'Email'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Create a Support Ticket
            const { error: ticketError } = await supabase.from('tickets').insert([
                {
                    user_id: user.id,
                    subject: formData.subject,
                    category: formData.category,
                    urgency: formData.urgency,
                    description: `${formData.description}\n\n[Contact Preference: ${formData.contactPreference}]`,
                    type: 'Support'
                }
            ]);

            if (ticketError) throw ticketError;

            // 2. Find an Admin user to assign the conversation to
            const { data: admins, error: adminError } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'admin')
                .limit(1);

            let adminId = null;
            if (admins && admins.length > 0) {
                adminId = admins[0].id;
            } else {
                // Fallback to a hardcoded admin if testing or if 'role' field is different
                const { data: anyAdmin } = await supabase.from('profiles').select('id').neq('id', user.id).limit(1);
                if (anyAdmin && anyAdmin.length > 0) adminId = anyAdmin[0].id;
            }

            if (adminId) {
                // 3. Create or find conversation
                const { data: existingConv } = await supabase
                    .from('conversations')
                    .select('id')
                    .or(`and(participant_a.eq.${user.id},participant_b.eq.${adminId}),and(participant_a.eq.${adminId},participant_b.eq.${user.id})`)
                    .limit(1);

                let conversationId;

                if (existingConv && existingConv.length > 0) {
                    conversationId = existingConv[0].id;
                } else {
                    const { data: newConv, error: convError } = await supabase
                        .from('conversations')
                        .insert([{ participant_a: user.id, participant_b: adminId }])
                        .select()
                        .single();

                    if (!convError && newConv) conversationId = newConv.id;
                }

                if (conversationId) {
                    // 4. Send initial message outlining the issue
                    const firstMessage = `[SUPPORT ESCALATION]\nSubject: ${formData.subject}\nCategory: ${formData.category}\nUrgency: ${formData.urgency}\n\nDescription:\n${formData.description}\n\nContact Preference: ${formData.contactPreference}`;

                    await supabase.from('messages').insert([
                        {
                            conversation_id: conversationId,
                            sender_id: user.id,
                            text: firstMessage,
                            is_read: false
                        }
                    ]);

                    // Navigate user to their messages tab so they can see the chat
                    navigate('/account/messages');
                }
            }

            alert(`Request Sent! A human agent will contact you shortly and you can monitor the chat in your Messages tab.`);
            onClose();
            setFormData({
                subject: '',
                category: 'Booking',
                urgency: 'Medium',
                description: '',
                contactPreference: 'Email'
            });
        } catch (error) {
            console.error('Error submitting ticket:', error);
            alert('Failed to submit request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                                        <User className="w-5 h-5 text-amber-500" />
                                        Escalate to Human Agent
                                    </h3>
                                    <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20 text-sm text-amber-800 dark:text-amber-200 mb-6 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <p>Our human agents are available 24/7. Please provide detailed information so we can route your request to the right specialist.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                            >
                                                <option>Booking Issue</option>
                                                <option>Payment Dispute</option>
                                                <option>Technical Support</option>
                                                <option>Account Verification</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Urgency</label>
                                            <select
                                                value={formData.urgency}
                                                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                            >
                                                <option>Low (General Inquiry)</option>
                                                <option>Medium (Need help today)</option>
                                                <option>High (Critical Issue)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subject</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Brief summary of the issue..."
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                                        <textarea
                                            rows={4}
                                            required
                                            placeholder="Please describe the issue in detail..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                                        />
                                    </div>

                                    <div className="pt-2 flex justify-end gap-3">
                                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
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
