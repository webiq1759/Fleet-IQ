import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

export const ListerAgreement = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-16 flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-lg">
                                Fleet<span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">IQ</span>
                            </span>
                        </div>
                        <div className="w-20" /> {/* Spacer for centering */}
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="space-y-8">
                    <div className="text-center space-y-4 mb-12">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Lister Agreement & Financial Operations
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                            Essential information regarding commissions, escrow policies, payouts, and dispute resolution for Fleet Owners operating on the Fleet IQ platform.
                        </p>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">

                        {/* 1. Commission & Fees */}
                        <section className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-4 mt-0">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-sm">1</span>
                                Platform Commissions & Fees
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300">
                                Fleet IQ charges a standardized commission on all successful bookings. This commission is automatically deducted from the total booking amount before funds are transferred to your wallet.
                            </p>
                            <ul className="mt-4 space-y-2 text-slate-600 dark:text-slate-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <span>The exact commission percentage is calculated dynamically based on the asset type and account tenure.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <span>All transactions, regardless of origin, pass through the Fleet IQ Ledger infrastructure. You cannot request direct bank transfers from renters.</span>
                                </li>
                            </ul>
                        </section>

                        {/* 2. Escrow & Release Timing */}
                        <section className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-4 mt-0">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-sm">2</span>
                                Escrow Policies & Release Timelines
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300">
                                To protect both parties, funds are held securely in a Platform Escrow Wallet. Funds are released based strict invariants and only after risk checks have passed. Release timing relies entirely on the asset type:
                            </p>

                            <div className="mt-6 overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                                            <th className="py-3 px-4 font-semibold">Asset Category</th>
                                            <th className="py-3 px-4 font-semibold">Fund Release Condition</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-600 dark:text-slate-300">
                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                            <td className="py-3 px-4">Cars</td>
                                            <td className="py-3 px-4">24 hours after booking start time</td>
                                        </tr>
                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                            <td className="py-3 px-4">Trucks</td>
                                            <td className="py-3 px-4">48 hours after booking start time</td>
                                        </tr>
                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                            <td className="py-3 px-4">Yachts</td>
                                            <td className="py-3 px-4">After completion of the booking</td>
                                        </tr>
                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                            <td className="py-3 px-4">Helicopters</td>
                                            <td className="py-3 px-4">After completion of the booking</td>
                                        </tr>
                                        <tr>
                                            <td className="py-3 px-4">Planes</td>
                                            <td className="py-3 px-4">After completion + manual platform approval</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* 3. Payouts & Reserves */}
                        <section className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-4 mt-0">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-sm">3</span>
                                Payouts & Reserve Holds
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-4">
                                Once funds are released from Escrow into your Wallet, you may manually issue a Payout Request. Note the following rules:
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                                        <ShieldCheck className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white m-0">Identity Enforcement</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                            Payouts will only be processed to bank accounts whose names match the verified Legal Name or Company Name associated with your profile. This cannot be modified.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white m-0">Platform Reserves</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                            Fleet IQ holds a mandatory 5-10% reserve from payouts for a specified cooldown period to manage chargebacks, disputes, and related risk factors.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 4. Disputes */}
                        <section className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-4 mt-0">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-sm">4</span>
                                Disputes & Fraud Prevention
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300">
                                The safety of our community is paramount. Fleet IQ reserves the right to freeze wallets without prior warning in the event of:
                            </p>
                            <ul className="mt-4 space-y-2 text-slate-600 dark:text-slate-300 list-disc list-inside ml-2">
                                <li>A formal dispute filed by a renter regarding asset quality or failure to provide service.</li>
                                <li>High-risk flags detected by our automated payment processors (including unsupported USD payment vectors).</li>
                                <li>Failure to meet the expected KYC, Tax ID, or identity consistency checks.</li>
                            </ul>
                            <div className="mt-6 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/20">
                                <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                                    By onboarding your asset to Fleet IQ, you agree to these financial invariants. The platform backend maintains absolute authority over fund holds, escrow releases, and payouts.
                                </p>
                            </div>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    );
};
