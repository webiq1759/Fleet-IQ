import React, { useState } from 'react';
import {
    Book, Code, Shield, Radio, Layers,
    Terminal, Globe, Copy, Check, ChevronRight,
    ArrowRight
} from 'lucide-react';
import { Button } from '../components/Button';

export const DeveloperDocs = () => {
    const [activeSection, setActiveSection] = useState('intro');
    const [copied, setCopied] = useState('');

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(''), 2000);
    };

    const menuItems = [
        { id: 'intro', label: 'Introduction', icon: Book },
        { id: 'auth', label: 'Authentication', icon: Shield },
        { id: 'endpoints', label: 'API Endpoints', icon: Terminal },
        { id: 'webhooks', label: 'Webhooks', icon: Radio },
        { id: 'widgets', label: 'Widgets & UI', icon: Layers },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-white border-r border-slate-200 h-auto md:h-screen sticky top-0 overflow-y-auto">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 font-bold text-xl text-slate-900 mb-1">
                        <Code className="w-6 h-6 text-red-600" />
                        <span>Developers</span>
                    </div>
                    <p className="text-xs text-slate-500">Fleet IQ Platform API</p>
                </div>
                <nav className="p-4 space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === item.id
                                    ? 'bg-red-50 text-red-700'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <item.icon className={`w-4 h-4 ${activeSection === item.id ? 'text-red-600' : 'text-slate-400'}`} />
                            {item.label}
                            {activeSection === item.id && <ChevronRight className="w-4 h-4 ml-auto text-red-400" />}
                        </button>
                    ))}
                </nav>
                <div className="p-4 mt-auto border-t border-slate-100">
                    <div className="bg-slate-900 rounded-xl p-4 text-white">
                        <h4 className="font-bold text-sm mb-1">Need specific help?</h4>
                        <p className="text-xs text-slate-400 mb-3">Our engineering team is available for integration support.</p>
                        <a href="mailto:support@fleetiq.cc" className="text-xs font-medium text-red-400 hover:text-red-300 flex items-center gap-1">
                            Contact Support <ArrowRight className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto h-screen">
                <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">

                    {/* Introduction */}
                    {activeSection === 'intro' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h1 className="text-4xl font-bold text-slate-900 mb-4">Fleet IQ API Documentation</h1>
                                <p className="text-lg text-slate-600 leading-relaxed">
                                    Welcome to the Fleet IQ Developer Platform. Our API allows you to integrate fleet booking capabilities directly into your applications, websites, and internal tools.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <Globe className="w-8 h-8 text-blue-500 mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">REST API</h3>
                                    <p className="text-sm text-slate-500 mb-4">
                                        Programmatically access assets, bookings, and availability with our RESTful endpoints.
                                    </p>
                                    <Button variant="outline" size="sm" onClick={() => setActiveSection('endpoints')}>View Endpoints</Button>
                                </div>
                                <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <Radio className="w-8 h-8 text-purple-500 mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Webhooks</h3>
                                    <p className="text-sm text-slate-500 mb-4">
                                        Receive real-time notifications for booking events, payments, and status changes.
                                    </p>
                                    <Button variant="outline" size="sm" onClick={() => setActiveSection('webhooks')}>Setup Webhooks</Button>
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-2xl p-8 text-white">
                                <h3 className="text-xl font-bold mb-4">Quick Start</h3>
                                <p className="text-slate-300 mb-6 max-w-2xl">
                                    Get up and running in minutes. Embed our pre-built booking widget or query the API directly.
                                </p>
                                <div className="bg-black/50 rounded-lg p-4 font-mono text-sm border border-slate-700">
                                    <span className="text-purple-400">curl</span> <span className="text-green-400">https://api.fleetiq.cc/v1/health</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Authentication */}
                    {activeSection === 'auth' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">Authentication</h2>
                                <p className="text-slate-600 mb-6">
                                    Verify your identity and access permissions using API keys.
                                </p>
                            </div>

                            <div className="prose max-w-none text-slate-600">
                                <p>
                                    Fleet IQ uses API keys to authenticate requests. You can view and manage your API keys in the <a href="/settings" className="text-red-600 hover:underline">Integration Settings</a> of your dashboard.
                                </p>
                                <p className="mt-4">
                                    Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.
                                </p>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Authorization Header</h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    Authentication to the API is performed via HTTP Basic Auth. Provide your API key as the basic auth username value. You do not need to provide a password.
                                </p>

                                <div className="bg-slate-900 rounded-lg p-4 relative group">
                                    <code className="block font-mono text-sm text-slate-300 break-all">
                                        Authorization: Bearer <span className="text-yellow-400">pk_live_...</span>
                                    </code>
                                    <button
                                        onClick={() => handleCopy('Authorization: Bearer pk_live_...', 'auth-header')}
                                        className="absolute top-2 right-2 p-2 bg-slate-800 rounded hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        {copied === 'auth-header' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* API Endpoints */}
                    {activeSection === 'endpoints' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">API Endpoints</h2>
                                <p className="text-slate-600">
                                    Core resources available for consumption. Base URL: <code className="bg-slate-100 px-2 py-1 rounded text-red-600">https://api.fleetiq.cc/v1</code>
                                </p>
                            </div>

                            {/* Endpoint 1 */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded text-sm">GET</span>
                                    <code className="text-lg font-mono text-slate-900">/partners/:id/assets</code>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <div className="p-6 border-b border-slate-100">
                                        <p className="text-slate-600 text-sm">Returns a list of approved assets belonging to a specific partner.</p>
                                    </div>
                                    <div className="bg-slate-50 p-6">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Response Example</h4>
                                        <pre className="text-xs font-mono text-slate-700 bg-white p-4 rounded-lg border border-slate-200 overflow-x-auto">
                                            {`{
  "data": [
    {
      "id": "ast_123456789",
      "title": "Luxury Business Jet",
      "type": "AIRCRAFT",
      "price": {
        "amount": 5000000,
        "currency": "NGN",
        "period": "daily"
      },
      "status": "available",
      "images": ["https://..."]
    }
  ],
  "meta": {
    "total": 1,
    "page": 1
  }
}`}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            {/* Endpoint 2 */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded text-sm">GET</span>
                                    <code className="text-lg font-mono text-slate-900">/assets/:id</code>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <div className="p-6 border-b border-slate-100">
                                        <p className="text-slate-600 text-sm">Retrieves details of a specific asset by ID.</p>
                                    </div>
                                    <div className="bg-slate-50 p-6">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Response Example</h4>
                                        <pre className="text-xs font-mono text-slate-700 bg-white p-4 rounded-lg border border-slate-200 overflow-x-auto">
                                            {`{
  "id": "ast_987654321",
  "title": "Ocean Breeze Yacht",
  "description": "50ft luxury yacht with crew...",
  "specs": {
    "capacity": 12,
    "speed": "30 knots"
  }
}`}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Webhooks */}
                    {activeSection === 'webhooks' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">Webhooks</h2>
                                <p className="text-slate-600">
                                    Listen for events on your Fleet IQ account so your integration can automatically trigger reactions.
                                </p>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                                <h3 className="text-amber-800 font-bold mb-2 flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Verifying Signatures
                                </h3>
                                <p className="text-amber-700 text-sm mb-4">
                                    Fleet IQ signs webhook events so you can verify that they were sent by us and not a third party.
                                    We verify using the `X-Fleet-Signature` header.
                                </p>
                                <div className="bg-white rounded border border-amber-200 p-3">
                                    <code className="text-xs font-mono text-amber-900">
                                        X-Fleet-Signature: t=1492774577,v1=5257a869e7ecebeda32affa62cdca3fa51af7c7406852dbc389b...
                                    </code>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Event Types</h3>
                                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                                    {[
                                        { event: 'booking.created', desc: 'Occurs whenever a new booking is created.' },
                                        { event: 'booking.paid', desc: 'Occurs whenever a booking payment is successful.' },
                                        { event: 'booking.cancelled', desc: 'Occurs whenever a booking is cancelled.' },
                                    ].map((evt) => (
                                        <div key={evt.event} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <code className="text-sm font-mono text-purple-600 bg-purple-50 px-2 py-1 rounded w-fit">{evt.event}</code>
                                            <span className="text-sm text-slate-600 flex-1">{evt.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Widgets */}
                    {activeSection === 'widgets' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">Widgets & Embedding</h2>
                                <p className="text-slate-600">
                                    The easiest way to integrate Fleet IQ is using our pre-built booking widgets.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-xl border border-slate-200">
                                    <h3 className="font-bold text-slate-900 mb-4">IFrame Window</h3>
                                    <p className="text-sm text-slate-500 mb-4">
                                        Embed your entire public booking page into your site using an iframe.
                                    </p>
                                    <div className="bg-slate-900 rounded-lg p-4 relative group">
                                        <code className="text-xs font-mono text-slate-300 block leading-relaxed break-all">
                                            &lt;iframe <br />
                                            &nbsp;&nbsp;src="https://fleetiq.cc/book/your-slug?embed=true" <br />
                                            &nbsp;&nbsp;width="100%" <br />
                                            &nbsp;&nbsp;height="800" <br />
                                            &nbsp;&nbsp;style="border:none; border-radius: 12px;" <br />
                                            &gt;&lt;/iframe&gt;
                                        </code>
                                        <button
                                            onClick={() => handleCopy('<iframe ... ></iframe>', 'iframe-code')}
                                            className="absolute top-2 right-2 p-2 bg-slate-800 rounded hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            {copied === 'iframe-code' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
