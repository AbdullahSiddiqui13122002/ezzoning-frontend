"use client";

import Link from 'next/link';
import { ArrowLeft, HardHat, Construction } from 'lucide-react';

export default function ProfessionalRegistryComingSoon() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-brand-ocean/20 selection:text-brand-slate flex flex-col justify-between pb-10">
      {/* Top Banner / Nav */}
      <div className="relative overflow-hidden bg-brand-slate text-white py-8 px-6 sm:px-12 border-b border-slate-800 shrink-0">
        <div className="max-w-6xl mx-auto relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-brand-ocean transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Map
          </Link>
          <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] bg-brand-gold/10 border border-brand-gold/20 px-3 py-1 rounded-xl">
            In Development
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
        {/* Animated Construction Icon */}
        <div className="w-24 h-24 bg-brand-ocean/10 rounded-[2rem] flex items-center justify-center mb-8 border border-brand-ocean/20 relative shadow-inner">
          <div className="absolute inset-0 rounded-[2rem] bg-brand-ocean/5 animate-pulse" />
          <Construction className="w-12 h-12 text-brand-ocean relative z-10" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-brand-slate tracking-tight mb-3">
          Architect & Engineer Registry
        </h1>
        <p className="text-2xl font-bold text-slate-400 mb-6 tracking-wide uppercase text-sm">
          Coming Soon
        </p>
        
        <p className="text-slate-500 font-medium leading-relaxed mb-8 max-w-md">
          We are currently building out a searchable directory of vetted local architects, structural engineers, land surveyors, and zoning consultants to help you with your property projects.
        </p>

        <Link href="/" className="btn-primary px-8 py-4 text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-ocean/20">
          Return to Map
        </Link>
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
        © {new Date().getFullYear()} ezZoning. All rights reserved.
      </footer>
    </div>
  );
}
