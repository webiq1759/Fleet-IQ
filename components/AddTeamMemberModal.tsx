
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Shield, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../supabaseClient';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void; // refreshes team list after invite
}

export const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Dispatcher' });
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const reset = () => {
    setFormData({ name: '', email: '', password: '', role: 'Dispatcher' });
    setSuccessMsg('');
    setErrorMsg('');
    setIsLoading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.functions.invoke('invite-team-member', {
        body: { email: formData.email, name: formData.name, password: formData.password, role: formData.role },
      });

      if (error) {
        let message = error.message || 'Failed to send invite';
        try {
          const ctx = (error as any).context;
          if (ctx?.json) {
            const body = await ctx.json();
            message = body?.error || message;
          }
        } catch (_) { /* ignore parse error */ }
        throw new Error(message);
      }

      // Handle any straggling custom errors if they exist in data
      if (data?.error) throw new Error(data.error);

      setSuccessMsg(`Account created for ${formData.name}! They can now log in using the email and password you provided.`);
      onAdd();
      setTimeout(() => { handleClose(); }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleDescriptions: Record<string, string> = {
    Dispatcher: 'Can manage bookings, assign crew, view fleet registry, dispatch, and track assets.',
    Accountant: 'Can view financial data, run reports, and access finance-related sections.',
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Add Team Member</h3>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {successMsg ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle className="w-14 h-14 text-green-500" />
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{successMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{errorMsg}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text" required placeholder="e.g. Sarah Jenkins"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email" required placeholder="sarah@company.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Login Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text" required placeholder="Choose a secure password" minLength={6}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all appearance-none"
                    value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="Dispatcher">Dispatcher</option>
                    <option value="Accountant">Accountant</option>
                  </select>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">{roleDescriptions[formData.role]}</p>
              </div>

              <div className="pt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  You are creating an active account for this team member. Please securely share the email and password with them so they can log in.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button variant="ghost" onClick={handleClose} type="button">Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Account...</> : 'Create Account'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
