import React from 'react';

export const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-8 md:p-12 border border-slate-100 dark:border-slate-800">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Privacy Policy</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Last updated: February 2026</p>

                <div className="space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Information We Collect</h2>
                        <p>
                            We collect information you provide directly to us, such as when you create an account, list a fleet, make a booking, or communicate with customer support. This may include your name, email address, phone number, payment information, and identity verification documents.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. How We Use Your Information</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>To provide, maintain, and improve our services.</li>
                            <li>To process transactions and send related information.</li>
                            <li>To verify your identity and prevent fraud.</li>
                            <li>To send you technical notices, updates, and support messages.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Information Sharing</h2>
                        <p>
                            We may share your information with fleet owners or renters as necessary to facilitate bookings. We do not sell your personal information to third parties. We may disclose information if required by law or to protect our rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Data Security</h2>
                        <p>
                            We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};
