"use client";

import { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, MessageSquare, AlertTriangle, Database } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'General Feedback' | 'Website Issue' | 'Incorrect Zoning Data';
  propertyDetails?: {
    address: string;
    secBlkLot?: string;
    zoneName?: string;
  } | null;
}

export default function FeedbackModal({ isOpen, onClose, initialType = 'General Feedback', propertyDetails }: FeedbackModalProps) {
  const [type, setType] = useState<string>(initialType);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync type with initialType when modal opens
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setSuccess(false);
      setError(null);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          name,
          email,
          message,
          propertyDetails: type === 'Incorrect Zoning Data' ? propertyDetails : undefined
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess(true);
        // Reset form
        setName('');
        setEmail('');
        setMessage('');
        // Close modal after 2.5 seconds
        setTimeout(() => {
          onClose();
        }, 2500);
      } else {
        throw new Error(data.error || 'Failed to submit feedback.');
      }
    } catch (err: any) {
      console.error("Feedback submit failed:", err);
      setError(err.message || 'Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-brand-slate/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-premium max-w-lg w-full p-8 sm:p-10 relative overflow-hidden animate-in zoom-in duration-300">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-400 hover:text-brand-slate transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {success ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 bg-brand-emerald/10 rounded-full flex items-center justify-center mb-6 border border-brand-emerald/20 animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-brand-emerald" />
            </div>
            <h3 className="text-2xl font-black text-brand-slate tracking-tight mb-2">Thank You!</h3>
            <p className="text-sm font-bold text-slate-400 leading-relaxed max-w-xs">
              Your message has been sent to our administration team. We appreciate your help in improving ezZoning!
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-brand-ocean/10 rounded-xl flex items-center justify-center border border-brand-ocean/20">
                {type === 'Incorrect Zoning Data' ? (
                  <Database className="w-5 h-5 text-brand-ocean" />
                ) : type === 'Website Issue' ? (
                  <AlertTriangle className="w-5 h-5 text-brand-ocean" />
                ) : (
                  <MessageSquare className="w-5 h-5 text-brand-ocean" />
                )}
              </div>
              <h2 className="text-2xl font-black tracking-tight text-brand-slate">
                {type === 'Incorrect Zoning Data' ? 'Report Data Issue' : 'Submit Feedback'}
              </h2>
            </div>
            <p className="text-sm font-bold text-slate-400 mb-6">
              Help us improve. Let us know what you experienced.
            </p>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-brand-slate uppercase tracking-widest block mb-2">Feedback Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-ocean text-sm font-bold bg-white"
                >
                  <option value="General Feedback">General Feedback</option>
                  <option value="Website Issue">Report a Bug / Website Issue</option>
                  <option value="Incorrect Zoning Data">Report Incorrect Zoning Data</option>
                </select>
              </div>

              {type === 'Incorrect Zoning Data' && propertyDetails && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mb-2 text-left">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Property Information</p>
                  <p className="text-xs font-black text-brand-slate leading-tight">{propertyDetails.address}</p>
                  {propertyDetails.secBlkLot && (
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Parcel ID: {propertyDetails.secBlkLot}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-brand-slate uppercase tracking-widest block mb-2">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-ocean text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-brand-slate uppercase tracking-widest block mb-2">Your Email</label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-ocean text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-brand-slate uppercase tracking-widest block mb-2">Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder={
                    type === 'Incorrect Zoning Data' 
                      ? 'Please describe what zoning data is incorrect (e.g. incorrect setbacks, lot coverage, or zone classification for this property)...'
                      : type === 'Website Issue'
                      ? 'Please describe the bug or problem you experienced, including steps to reproduce it...'
                      : 'Share your suggestions, feature requests, or general thoughts about ezZoning...'
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-ocean text-sm font-bold resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-center text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary py-4 text-xs font-black uppercase tracking-widest text-center flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <span>Submit</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
