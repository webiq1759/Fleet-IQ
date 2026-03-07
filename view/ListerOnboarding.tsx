
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, ChevronRight, ChevronLeft, Upload, Check, ShieldCheck, FileText, AlertCircle, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { NotificationModal } from '../components/NotificationModal';
import { OnboardingState } from '../types';
import { supabase } from '../supabaseClient';
import { countries } from '../data/countries';

const STEPS = [
    { id: 1, title: 'Account Type', description: 'Choose how you want to operate' },
    { id: 2, title: 'Basic Info', description: 'Tell us about yourself or your company' },
    { id: 3, title: 'Address', description: 'Where are you located?' },
    { id: 4, title: 'Verification', description: 'Upload required documents' },
    { id: 5, title: 'Review', description: 'Confirm your details' }
];

export const ListerOnboarding = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'error' as 'error' | 'info' | 'success' });

    const [formData, setFormData] = useState<OnboardingState>({
        accountType: 'INDIVIDUAL',
        basicInfo: { fullName: '', email: '', phone: '', dateOfBirth: '' },
        companyInfo: { companyName: '', registrationNumber: '', taxId: '', website: '' },
        address: { street: '', city: '', state: '', country: '', zipCode: '' },
        documents: { identityCard: null, businessRegistration: null, proofOfAddress: null, taxCertificate: null }
    });

    useEffect(() => {
        const fetchUserData = async () => {
            setIsLoadingUser(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUser(user);
                // Check if already lister
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (profile?.role === 'LISTER') {
                    navigate('/');
                    return;
                }

                // Populate Basic Info from existing renter data
                setFormData(prev => ({
                    ...prev,
                    basicInfo: {
                        ...prev.basicInfo,
                        fullName: profile?.full_name || user.user_metadata?.full_name || '',
                        email: user.email || '',
                        phone: user.phone || user.user_metadata?.phone || prev.basicInfo.phone
                    }
                }));
            }
            setIsLoadingUser(false);
        };
        fetchUserData();
    }, [navigate]);

    const validateStep = (step: number) => {
        switch (step) {
            case 1:
                return true;
            case 2:
                const basicValid = !!(formData.basicInfo.fullName && formData.basicInfo.email);
                if (formData.accountType === 'COMPANY') {
                    return basicValid && !!(formData.companyInfo.companyName && formData.companyInfo.registrationNumber && formData.companyInfo.taxId);
                }
                return basicValid;
            case 3:
                return !!(formData.address.street && formData.address.city && formData.address.state);
            case 4:
                // Verification step validation
                const hasId = !!formData.documents.identityCard;
                const hasBizReg = !!formData.documents.businessRegistration;

                if (formData.accountType === 'COMPANY') {
                    return hasBizReg;
                } else {
                    return hasId;
                }
            case 5:
                return termsAccepted;
            default:
                return false;
        }
    };

    const handleNext = async () => {
        if (!validateStep(currentStep)) {
            setAlertModal({
                isOpen: true,
                title: 'Incomplete Section',
                message: 'Please fill in all required fields and upload necessary documents before proceeding. Note: Ensure you use your real name as it cannot be modified later.',
                type: 'error'
            });
            return;
        }

        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo(0, 0);
        } else {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    // 1. Upload KYC document to Supabase Storage
                    const kycFile = formData.accountType === 'COMPANY'
                        ? formData.documents.businessRegistration
                        : formData.documents.identityCard;

                    let kycDocUrl: string | null = null;

                    if (kycFile) {
                        const cleanName = kycFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
                        const kycPath = `${user.id}/${Date.now()}_${cleanName}`;
                        const { error: uploadError } = await supabase.storage
                            .from('kyc-documents')
                            .upload(kycPath, kycFile, { upsert: true });

                        if (uploadError) throw new Error(`Document upload failed: ${uploadError.message}`);

                        const { data: { publicUrl } } = supabase.storage
                            .from('kyc-documents')
                            .getPublicUrl(kycPath);
                        kycDocUrl = publicUrl;
                    }

                    // 2. Update profile: LISTER role + kyc_status pending (not auto-verified)
                    const { error } = await supabase
                        .from('profiles')
                        .update({
                            role: 'LISTER',
                            full_name: formData.basicInfo.fullName,
                            phone: formData.basicInfo.phone,
                            company_name: formData.accountType === 'COMPANY' ? formData.companyInfo.companyName : null,
                            rc_number: formData.accountType === 'COMPANY' ? formData.companyInfo.registrationNumber : null,
                            tax_id: formData.accountType === 'COMPANY' ? formData.companyInfo.taxId : null,
                            country: formData.address.country,
                            state: formData.address.state,
                            location: `${formData.address.street}, ${formData.address.city}, ${formData.address.state}, ${formData.address.country}`,
                            kyc_status: 'pending',
                            kyc_submitted_at: new Date().toISOString(),
                            kyc_doc_url: kycDocUrl
                        })
                        .eq('id', user.id);

                    if (error) throw error;

                    localStorage.setItem('fleet_iq_user_mode', 'LISTER');
                    setIsSuccessModalOpen(true);
                } else {
                    setAlertModal({
                        isOpen: true,
                        title: 'Login Required',
                        message: 'Please log in or register an account first to complete onboarding as a Fleet Owner.',
                        type: 'info'
                    });
                }
            } catch (err: any) {
                console.error("Error submitting application:", err);
                setAlertModal({
                    isOpen: true,
                    title: 'Submission Failed',
                    message: err.message || 'Failed to submit application',
                    type: 'error'
                });
            }
        }
    };

    const updateFormData = (section: any, data: any) => {
        setFormData(prev => ({ ...prev, [section]: { ...prev[section as keyof OnboardingState] as any, ...data } }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (formData.accountType === 'COMPANY') {
                updateFormData('documents', { businessRegistration: file });
            } else {
                updateFormData('documents', { identityCard: file });
            }
        }
    };

    if (isLoadingUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-200 font-sans">
            {/* Mobile Header */}
            <div className="md:hidden p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center sticky top-0 z-20">
                <div onClick={() => navigate('/')} className="cursor-pointer flex items-center gap-2">
                    <img src="/logo.png" alt="FleetIQ Logo" className="w-6 h-6" />
                    <span className="font-bold text-slate-900 dark:text-white text-lg">
                        Fleet<span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">IQ</span>
                    </span>
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Step {currentStep} of {STEPS.length}
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-80 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-8 flex-col h-screen sticky top-0">
                <div className="mb-12 cursor-pointer flex items-center gap-2" onClick={() => navigate('/')}>
                    <img src="/logo.png" alt="FleetIQ Logo" className="w-8 h-8" />
                    <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Fleet<span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">IQ</span>
                    </span>
                </div>
                <nav className="space-y-6">
                    {STEPS.map((step) => (
                        <div key={step.id} className={`flex items-center ${step.id === currentStep ? 'text-red-600 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs mr-3 transition-colors ${step.id <= currentStep ? 'border-red-600 text-red-600' : 'border-slate-300 dark:border-slate-700'}`}>
                                {step.id < currentStep ? <Check className="w-4 h-4" /> : step.id}
                            </div>
                            {step.title}
                        </div>
                    ))}
                </nav>

                <div className="mt-auto pt-8 border-t border-slate-200 dark:border-slate-800">
                    <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace
                    </button>
                    <div className="text-xs text-slate-400">
                        © {new Date().getFullYear()} Fleet IQ. All rights reserved.
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col h-[calc(100vh-60px)] md:h-screen overflow-hidden relative">
                {/* Mobile Progress Bar */}
                <div className="md:hidden h-1 bg-slate-100 dark:bg-slate-800 w-full sticky top-0 z-10">
                    <div className="h-full bg-red-600 transition-all duration-300 ease-out" style={{ width: `${(currentStep / STEPS.length) * 100}%` }}></div>
                </div>

                <main className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth">
                    <div className="max-w-2xl mx-auto min-h-[60vh]">
                        <div className="mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-slate-900 dark:text-white">{STEPS[currentStep - 1].title}</h2>
                            <p className="text-slate-500 dark:text-slate-400">{STEPS[currentStep - 1].description}</p>
                        </div>

                        {currentStep === 1 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                <div
                                    onClick={() => setFormData(p => ({ ...p, accountType: 'INDIVIDUAL' }))}
                                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${formData.accountType === 'INDIVIDUAL' ? 'border-red-500 bg-red-50 dark:bg-red-900/10 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${formData.accountType === 'INDIVIDUAL' ? 'bg-white dark:bg-slate-800 text-red-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                        <User className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Individual</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">I own the asset personally and want to list it.</p>
                                </div>
                                <div
                                    onClick={() => setFormData(p => ({ ...p, accountType: 'COMPANY' }))}
                                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${formData.accountType === 'COMPANY' ? 'border-red-500 bg-red-50 dark:bg-red-900/10 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${formData.accountType === 'COMPANY' ? 'bg-white dark:bg-slate-800 text-red-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Company</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">I represent a registered business entity.</p>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-5">
                                {currentUser ? (
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex items-start gap-3 mb-6">
                                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            Note: Ensure you used your real name as it cannot be modified later.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3 mb-6">
                                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            Your basic information is locked for security. Ensure you are logged in to pre-fill these details. Unregistered users must sign up first to onboard as a Fleet Owner.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                                    <input
                                        type="text"
                                        disabled
                                        className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                        value={formData.basicInfo.fullName}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                                    <input
                                        type="email"
                                        disabled
                                        className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                        value={formData.basicInfo.email}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                                    <input
                                        type="tel"
                                        disabled
                                        className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                        value={formData.basicInfo.phone}
                                    />
                                </div>

                                {formData.accountType === 'COMPANY' && (
                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-5 animate-in slide-in-from-bottom-4 duration-300">
                                        <h3 className="font-bold text-slate-900 dark:text-white">Business Details</h3>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="Business Name Ltd"
                                                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                                value={formData.companyInfo.companyName}
                                                onChange={e => updateFormData('companyInfo', { companyName: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Registration Number (RC) <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    placeholder="RC123456"
                                                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                                    value={formData.companyInfo.registrationNumber}
                                                    onChange={e => updateFormData('companyInfo', { registrationNumber: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tax ID (TIN) <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    placeholder="12345678-0001"
                                                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                                    value={formData.companyInfo.taxId}
                                                    onChange={e => updateFormData('companyInfo', { taxId: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Website (Optional)</label>
                                            <input
                                                type="url"
                                                placeholder="https://example.com"
                                                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                                value={formData.companyInfo.website}
                                                onChange={e => updateFormData('companyInfo', { website: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Country</label>
                                    <div className="relative">
                                        <select
                                            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none appearance-none"
                                            value={formData.address.country}
                                            onChange={e => updateFormData('address', { country: e.target.value, state: '' })}
                                        >
                                            <option value="">Select Country</option>
                                            {countries.map(c => (
                                                <option key={c.code} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>

                                {formData.address.country && (
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">State</label>
                                        <div className="relative">
                                            <select
                                                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none appearance-none"
                                                value={formData.address.state}
                                                onChange={e => updateFormData('address', { state: e.target.value })}
                                            >
                                                <option value="">Select State</option>
                                                {countries.find(c => c.name === formData.address.country)?.states.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Street Address</label>
                                    <input
                                        type="text"
                                        placeholder="123 Main St"
                                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                        value={formData.address.street}
                                        onChange={e => updateFormData('address', { street: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">City</label>
                                    <input
                                        type="text"
                                        placeholder="Lagos"
                                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                        value={formData.address.city}
                                        onChange={e => updateFormData('address', { city: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer group ${(formData.accountType === 'COMPANY' ? formData.documents.businessRegistration : formData.documents.identityCard)
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                                        : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-red-400'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept=".pdf,.png,.jpg,.jpeg"
                                    />
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        {(formData.accountType === 'COMPANY' ? formData.documents.businessRegistration : formData.documents.identityCard) ? (
                                            <Check className="w-8 h-8 text-green-600" />
                                        ) : (
                                            <Upload className="w-8 h-8 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                                        )}
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                                        {formData.accountType === 'COMPANY' ? 'Upload CAC Certificate' : 'Upload Valid ID'}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                                        {(formData.accountType === 'COMPANY' ? formData.documents.businessRegistration : formData.documents.identityCard)?.name || 'Drag and drop or click to upload'}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-4">Supported formats: PDF, PNG, JPG</p>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />
                                    <p>Your documents are encrypted and securely stored. We only use them for identity verification purposes.</p>
                                </div>
                            </div>
                        )}

                        {currentStep === 5 && (
                            <div className="space-y-6">
                                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center">
                                        <ShieldCheck className="w-5 h-5 mr-2 text-green-600" />
                                        Review Details
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold mb-1">Full Name</p>
                                            <p className="text-slate-900 dark:text-white font-medium">{formData.basicInfo.fullName}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold mb-1">Account Type</p>
                                            <p className="text-slate-900 dark:text-white font-medium">{formData.accountType}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold mb-1">Email</p>
                                            <p className="text-slate-900 dark:text-white font-medium">{formData.basicInfo.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold mb-1">Location</p>
                                            <p className="text-slate-900 dark:text-white font-medium">{formData.address.city}, {formData.address.state}</p>
                                        </div>
                                        {formData.accountType === 'COMPANY' && (
                                            <>
                                                <div>
                                                    <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold mb-1">Company</p>
                                                    <p className="text-slate-900 dark:text-white font-medium">{formData.companyInfo.companyName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold mb-1">Reg Number</p>
                                                    <p className="text-slate-900 dark:text-white font-medium">{formData.companyInfo.registrationNumber}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <label className="flex items-start gap-3 p-4 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={e => setTermsAccepted(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                        I verify that the information provided is accurate and agree to Fleet IQ's <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">Terms of Service</a> and <a href="/lister-agreement" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">Lister Agreement</a>.
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>
                </main>

                {/* Footer Controls & Navigation */}
                <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-20">
                    <div className="p-4 md:p-6 flex justify-between">
                        <Button variant="ghost" onClick={() => currentStep > 1 ? setCurrentStep(c => c - 1) : navigate('/')} className="text-slate-600 dark:text-slate-300">
                            Back
                        </Button>
                        <Button onClick={handleNext} disabled={currentStep === 5 && !termsAccepted} className="px-8">
                            {currentStep === 5 ? 'Submit Application' : 'Continue'}
                        </Button>
                    </div>
                </div>
            </div>

            <NotificationModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />

            <NotificationModal
                isOpen={isSuccessModalOpen}
                onClose={() => { setIsSuccessModalOpen(false); window.location.href = '/'; }}
                title="Application Submitted! 🎉"
                message="Your application is under review. Our team will verify your documents within 1–5 hours. You can access your dashboard now — a status banner will keep you updated."
            />
        </div>
    );
};
