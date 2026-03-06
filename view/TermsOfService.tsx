import React from 'react';

export const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-8 md:p-12 border border-slate-100 dark:border-slate-800">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Terms of Service</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Last updated: February 2026</p>

                <div className="space-y-8 text-slate-600 dark:text-slate-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using Fleet IQ ("the Platform"), you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. User Responsibilities</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>You must provide accurate and complete information when creating an account.</li>
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                            <li>Asset owners must ensure all listed fleets comply with local regulations and safety standards.</li>
                            <li>Renters must use assets responsibly and in accordance with the owner's rules.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Booking and Payments</h2>
                        <p>
                            All bookings are subject to availability and owner approval. Payments are processed securely through our platform. Fleet IQ holds funds in escrow until the service is successfully delivered or the cancellation policy conditions are met.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Liability and Insurance</h2>
                        <p>
                            Fleet IQ acts as a marketplace connecting owners and renters. We are not a party to the rental agreement. Users are encouraged to verify insurance coverage and liability terms for each booking.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Termination</h2>
                        <p>
                            We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or compromise the safety of our community.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};
