"use client";

import React, { useEffect, useState } from 'react';
import { X, Play, MapPin, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  // Reset loading state when modal reopens
  useEffect(() => {
    if (isOpen) {
      setIsVideoLoading(true);
    }
  }, [isOpen]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col animate-scale-in max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-slate-100/80 backdrop-blur-sm hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Section: Title & Intro */}
        <div className="w-full bg-white px-8 pt-10 pb-6 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-ocean/10 text-brand-ocean rounded-xl mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-ocean opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-ocean"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest">Live Preview</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-black text-brand-slate tracking-tight mb-4 leading-tight">
            Unlock Professional <span className="text-brand-ocean italic">Zoning Insights</span>
          </h2>
          
          <p className="text-slate-500 text-sm lg:text-base leading-relaxed max-w-2xl">
            Stop digging through hundreds of pages of municipal codes. Simply click a property on the map to instantly reveal its zoning district, setback requirements, and visual plot plans.
          </p>
        </div>

        {/* Middle Section: Full Width Video */}
        <div className="w-full bg-slate-50 relative p-6 md:p-8 border-y border-slate-100 flex justify-center">
          {/* Decorative Background */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-ocean/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-emerald/10 rounded-full blur-3xl" />
          </div>

          {/* Media Container */}
          <div className="relative w-full max-w-3xl aspect-[16/10] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden group">
            {isVideoLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-sm z-10 transition-opacity duration-300">
                <div className="w-10 h-10 border-4 border-brand-ocean/30 border-t-brand-ocean rounded-full animate-spin mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-ocean/80 animate-pulse">Loading preview...</p>
              </div>
            )}

            <video 
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iogrktsiwzcmxjooxfei.supabase.co'}/storage/v1/object/public/public-assets/demo-placeholder.mp4`}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
              onLoadStart={() => setIsVideoLoading(true)}
              onCanPlay={() => setIsVideoLoading(false)}
              onWaiting={() => setIsVideoLoading(true)}
              onPlaying={() => setIsVideoLoading(false)}
              onError={(e) => {
                setIsVideoLoading(false);
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.video-fallback');
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
            
            {/* Fallback state when image is missing */}
            <div className="video-fallback hidden absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-white p-8 text-center">
              <Play className="w-12 h-12 text-brand-ocean mb-4 opacity-50" />
              <p className="text-sm font-bold tracking-widest uppercase text-slate-300 mb-2">Media Container</p>
              <p className="text-xs text-slate-400 max-w-xs">Client: Drop your 10-second looping GIF or Video here. Replace "/demo-placeholder.mp4" in the code.</p>
            </div>
          </div>
        </div>

        {/* Bottom Section: Features & CTAs */}
        <div className="w-full bg-white px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="flex-1 flex flex-col sm:flex-row gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-2.5 bg-brand-ocean/10 rounded-xl mt-1 shrink-0">
                <MapPin className="w-4 h-4 text-brand-ocean" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-700 tracking-tight">Interactive Mapping</h4>
                <p className="text-xs text-slate-500 mt-1">Color-coded districts for instant visual clarity.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 flex-1">
              <div className="p-2.5 bg-brand-emerald/10 rounded-xl mt-1 shrink-0">
                <FileText className="w-4 h-4 text-brand-emerald" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-700 tracking-tight">Automated Reporting</h4>
                <p className="text-xs text-slate-500 mt-1">Generate official PDF zoning reports instantly.</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-64 flex flex-col gap-3 shrink-0">
            <button 
              onClick={onClose}
              className="btn-primary w-full flex items-center justify-center gap-2 group py-4 shadow-xl shadow-brand-ocean/20"
            >
              Start Exploring Map
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link 
              href="/pricing"
              onClick={onClose}
              className="btn-secondary w-full text-center py-4"
            >
              View Pro Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoModal;
