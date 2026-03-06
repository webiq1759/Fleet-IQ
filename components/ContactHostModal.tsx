import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

interface ContactHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostId: string; // Added hostId
  hostName: string;
  assetId: string; // Added assetId
  assetTitle: string;
}

export const ContactHostModal: React.FC<ContactHostModalProps> = ({ isOpen, onClose, hostId, hostName, assetId, assetTitle }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to send a message.');
        // navigate('/login'); // Optional
        setIsSending(false);
        return;
      }

      // Check if conversation exists
      const { data: existingConvs, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
        .or(`participant_a.eq.${hostId},participant_b.eq.${hostId}`)
        .eq('asset_id', assetId);

      // Simple check: find one where both are participants. 
      // The above query might return conversations where one is participant but not the other if not careful with AND logic.
      // Better RLS usage: 
      // We want a conversation where:
      // (p1 = me AND p2 = host) OR (p1 = host AND p2 = me) AND asset_id = assetId

      let conversationId = null;

      // Let's do a more precise fetch or just create and handled duplicates if we had a constraint (we don't atm)
      // For now, let's just insert and rely on logic or fetch first.

      const { data: correctConvs } = await supabase
        .from('conversations')
        .select('*')
        .eq('asset_id', assetId)
        .or(`and(participant_a.eq.${user.id},participant_b.eq.${hostId}),and(participant_a.eq.${hostId},participant_b.eq.${user.id})`)
        .single();

      if (correctConvs) {
        conversationId = correctConvs.id;
      } else {
        // Create new
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            participant_a: user.id,
            participant_b: hostId,
            asset_id: assetId,
            last_message: message,
            last_message_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;
        conversationId = newConv.id;
      }

      // Send message
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: message
        });

      if (msgError) throw msgError;

      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
        setMessage('');
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Contact {hostName}</h3>
          <button
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {isSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                <Send className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Message Sent!</h4>
              <p className="text-slate-500 dark:text-slate-400">Your message has been sent to {hostName}.</p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Inquiry about
                </label>
                <div className="text-sm text-slate-900 dark:text-white font-medium p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  {assetTitle}
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                  placeholder={`Hi ${hostName}, I have a question about...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2 flex gap-3">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSending} className="flex-1">
                  {isSending ? 'Sending...' : 'Send Message'}
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