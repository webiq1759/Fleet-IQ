import React from 'react';
import { Clock, XCircle, ShieldCheck } from 'lucide-react';

interface KycStatusBannerProps {
    status: 'pending' | 'verified' | 'rejected' | null | undefined;
    rejectionNote?: string | null;
}

export const KycStatusBanner: React.FC<KycStatusBannerProps> = ({ status, rejectionNote }) => {
    if (!status || status === 'verified') return null;

    if (status === 'pending') {
        return (
            <div className="mx-4 md:mx-0 mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-900/20 px-4 py-3.5">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                        Identity Verification In Progress
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                        Your submitted documents are being reviewed by our team. This usually takes <strong>1–5 hours</strong>. You'll be notified once verified.
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'rejected') {
        return (
            <div className="mx-4 md:mx-0 mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-800/60 dark:bg-red-900/20 px-4 py-3.5">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                        Verification Rejected
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                        {rejectionNote
                            ? <>Reason: <strong>{rejectionNote}</strong>. </>
                            : ''}
                        Please contact <a href="mailto:support@fleetiq.cc" className="underline font-medium">support@fleetiq.cc</a> to resubmit your documents.
                    </p>
                </div>
            </div>
        );
    }

    return null;
};
