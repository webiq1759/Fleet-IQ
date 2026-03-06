
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Calendar, FileText, Tag, Car } from 'lucide-react';
import { Button } from './Button';
import { Asset } from '../types';

interface AddFinanceEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (entry: any) => void;
    fleets: Asset[];
}

export const AddFinanceEntryModal: React.FC<AddFinanceEntryModalProps> = ({ isOpen, onClose, onAdd, fleets }) => {
    const [type, setType] = useState<'Income' | 'Expense'>('Expense');
    const [formData, setFormData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        assetId: '',
        reference: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({ ...formData, type });
        onClose();
        // Reset
        setFormData({
            amount: '',
            date: new Date().toISOString().split('T')[0],
            description: '',
            category: '',
            assetId: '',
            reference: ''
        });
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
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add New Entry</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Record a financial transaction.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Transaction Type Toggle */}
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
                            <button
                                type="button"
                                onClick={() => setType('Expense')}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${type === 'Expense'
                                    ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Expense
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('Income')}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${type === 'Income'
                                    ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Income
                            </button>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Amount <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white appearance-none"
                                    >
                                        <option value="">Select...</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Fuel">Fuel</option>
                                        <option value="Insurance">Insurance</option>
                                        <option value="Salary">Crew Salary</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Invoice <span className="text-red-500">*</span></label>
                            <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">Click to upload invoice (PDF/JPG)</p>
                                <input type="file" required className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <textarea
                                    required
                                    rows={2}
                                    placeholder="e.g. Monthly maintenance for G-Wagon"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white resize-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Related Asset (Optional)</label>
                            <div className="relative">
                                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    value={formData.assetId}
                                    onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white appearance-none"
                                >
                                    <option value="">None / General</option>
                                    {fleets.map(asset => (
                                        <option key={asset.id} value={asset.id}>{asset.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={(e) => handleSubmit(e as any)}
                        disabled={!formData.amount || !formData.date || !formData.description}
                    >
                        Save Entry
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
