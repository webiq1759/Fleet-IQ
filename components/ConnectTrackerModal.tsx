
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Server, CheckCircle, AlertCircle, Radio, MapPin, Activity } from 'lucide-react';
import { Button } from './Button';

interface ConnectTrackerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect: () => void;
}

const PROVIDERS = [
    { id: 'samsara', name: 'Samsara', logoSvg: <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" /> },
    { id: 'geotab', name: 'Geotab', logoSvg: <MapPin className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> },
    { id: 'verizon', name: 'Verizon Connect', logoSvg: <Radio className="w-6 h-6 text-red-600 dark:text-red-400" /> },
    { id: 'generic', name: 'Generic API / Webhook', logoSvg: <Server className="w-6 h-6 text-slate-600 dark:text-slate-400" /> }
];

export const ConnectTrackerModal: React.FC<ConnectTrackerModalProps> = ({ isOpen, onClose, onConnect }) => {
    const [step, setStep] = useState(1);
    const [selectedProvider, setSelectedProvider] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    if (!isOpen) return null;

    const handleConnect = (e: React.FormEvent) => {
        e.preventDefault();
        setIsConnecting(true);

        // Simulate API connection delay
        setTimeout(() => {
            setIsConnecting(false);
            onConnect();
            onClose();
            // Reset state
            setStep(1);
            setSelectedProvider('');
            setApiKey('');
        }, 2000);
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Connect Tracking System</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Integrate real-time fleet telemetry.</p>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Select your IoT / GPS Provider</p>
                            <div className="grid grid-cols-1 gap-3">
                                {PROVIDERS.map((provider) => (
                                    <button
                                        key={provider.id}
                                        onClick={() => setSelectedProvider(provider.id)}
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${selectedProvider === provider.id
                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/10 ring-1 ring-red-500'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 bg-white dark:bg-slate-800'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 p-1 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                                                {provider.logoSvg}
                                            </div>
                                            <span className="font-semibold text-slate-900 dark:text-white">{provider.name}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedProvider === provider.id ? 'border-red-500 bg-red-500' : 'border-slate-300 dark:border-slate-600'
                                            }`}>
                                            {selectedProvider === provider.id && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleConnect} className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800 dark:text-blue-200">
                                    <p className="font-semibold mb-1">Connecting to {PROVIDERS.find(p => p.id === selectedProvider)?.name}</p>
                                    <p>You need an API Access Token with "Read Telemetry" scope enabled.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">API Key / Access Token</label>
                                    <input
                                        type="password"
                                        required
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white font-mono"
                                        placeholder="sk_live_..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Webhook URL (Optional)</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value="https://api.fleetiq.io/v1/webhooks/telemetry"
                                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 select-all font-mono text-sm"
                                    />
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    {step === 1 ? (
                        <>
                            <Button variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button onClick={() => setStep(2)} disabled={!selectedProvider}>Continue</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => setStep(1)} disabled={isConnecting}>Back</Button>
                            <Button onClick={(e) => handleConnect(e as any)} disabled={!apiKey || isConnecting}>
                                {isConnecting ? 'Verifying Connection...' : 'Complete Integration'}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
