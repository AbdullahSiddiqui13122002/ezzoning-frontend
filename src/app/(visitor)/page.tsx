"use client";
import { useState, useEffect } from "react";
import { Map as MapIcon, User, Filter, Layers, FileText, ChevronRight, LogOut, LayoutDashboard, Menu, X, MessageSquare } from "lucide-react";
import Link from "next/link";
import MapComponent from "@/components/MapComponent";
import SearchBar from "@/components/SearchBar";
import RightPanel from "@/components/RightPanel";
import DemoModal from "@/components/DemoModal";
import FeedbackModal from "@/components/FeedbackModal";
import { useMapStore } from "@/store/useMapStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

export default function Home() {
  const activeFilters = useMapStore((state) => state.activeFilters);
  const toggleFilter = useMapStore((state) => state.toggleFilter);
  const selectedProperty = useMapStore((state) => state.selectedProperty);
  const { user, signOut, dbPlanTier } = useAuthStore();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackInitialType, setFeedbackInitialType] = useState<'General Feedback' | 'Website Issue' | 'Incorrect Zoning Data'>('General Feedback');
  const router = useRouter();

  // Forward password recovery links arriving at root URL to update-password
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash.includes("type=recovery") || search.includes("type=recovery")) {
        router.push(`/auth/update-password${hash || search}`);
      }
    }
  }, [router]);

  // Expose the open function so the RightPanel can trigger it manually
  useEffect(() => {
    // We can use a custom event or a simple window method for RightPanel to call
    (window as any).openDemoModal = () => setIsDemoOpen(true);
    return () => {
      delete (window as any).openDemoModal;
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white selection:bg-brand-ocean/20 selection:text-brand-slate">
      <div className="relative z-50 shrink-0">
        <aside aria-label="Service coverage" className="bg-brand-slate px-4 py-2 text-center text-xs leading-4 text-white lg:px-8 lg:text-sm lg:leading-5">
          <p className="hidden lg:block">
            Search any address in <span className="font-semibold">Nassau and Suffolk counties.</span>{" "}
            <span className="text-sky-100">Zoning data for NYC and Upstate New York is coming soon.</span>
          </p>
          <p className="lg:hidden">
            <span className="block font-semibold">Search Nassau &amp; Suffolk counties</span>
            <span className="block text-sky-100">NYC &amp; Upstate NY zoning data coming soon</span>
          </p>
        </aside>

      {/* Top Navbar */}
      <header className="h-16 lg:h-20 bg-white/80 backdrop-blur-2xl border-b border-slate-100 flex items-center justify-between px-4 lg:px-8 shrink-0 z-50 transition-all">
        <div className="flex items-center gap-3 lg:gap-4">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="ezZoning Logo" className="h-10 lg:h-12 w-auto" />
          </Link>
        </div>

        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <SearchBar />
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden lg:flex items-center gap-1">
            <Link href="/ecode-library" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-brand-ocean transition-all px-4 py-2 rounded-xl hover:bg-brand-ocean/5">
              Ecode
            </Link>
            <Link href="/professional-registry" className="text-xs font-black uppercase tracking-widest text-brand-gold hover:text-yellow-500 transition-all px-4 py-2 rounded-xl hover:bg-brand-gold/5">
              Need to hire a professional?
            </Link>
            <button 
              onClick={() => {
                setFeedbackInitialType('General Feedback');
                setIsFeedbackOpen(true);
              }}
              className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-brand-ocean transition-all px-4 py-2 rounded-xl hover:bg-brand-ocean/5 pt-0.5"
            >
              Give Feedback
            </button>
          </nav>

          {!user && (
            <Link href="/pricing" className="btn-secondary px-6 hidden xl:flex">
              Go Pro
            </Link>
          )}

          {/* User Auth Section */}
          <div className="flex items-center gap-3 border-l border-slate-100 pl-4 lg:pl-6 ml-2">
            {user ? (
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="hidden sm:flex flex-col text-right justify-center">
                  <span className="text-xs lg:text-sm font-black text-brand-slate tracking-tight mb-1">{user.email?.split('@')[0]}</span>
                  <div className="flex justify-end">
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                      dbPlanTier === 'UNLIMITED' ? 'bg-amber-100 text-amber-700 border-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.2)]' :
                      dbPlanTier === 'BASIC' ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20' :
                      dbPlanTier === 'PAYG' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {dbPlanTier} PLAN
                    </span>
                  </div>
                </div>
                <div 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="h-11 w-11 rounded-2xl bg-brand-ocean/10 flex items-center justify-center border border-brand-ocean/20 cursor-pointer hover:bg-brand-ocean/20 transition-all relative shadow-sm"
                >
                  <User className="w-5 h-5 text-brand-ocean" />
                  
                  {/* Dropdown Menu (Click based) */}
                  <div className={`absolute top-full right-0 mt-3 w-56 bg-white border border-slate-100 rounded-[2rem] shadow-premium transition-all duration-300 py-3 px-2 z-50 ${isUserMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                    <div className="px-4 py-2 border-b border-slate-50 mb-2 text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged in as</p>
                      <p className="text-xs font-bold text-brand-slate truncate">{user.email}</p>
                    </div>
                    <Link href="/dashboard" className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-brand-ocean hover:bg-brand-ocean/5 rounded-xl flex items-center gap-3 transition-colors mb-1">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <button onClick={handleSignOut} className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-xl flex items-center gap-3 transition-colors">
                      <LogOut className="w-4 h-4" />
                      End Session
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/auth" className="flex items-center gap-3 group">
                <div className="h-11 w-11 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200 cursor-pointer group-hover:border-brand-ocean/40 group-hover:bg-brand-ocean/5 group-hover:shadow-md transition-all shadow-sm">
                  <User className="w-5 h-5 text-slate-400 group-hover:text-brand-ocean transition-colors" />
                </div>
                <span className="hidden md:inline text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-brand-ocean transition-colors">Sign In</span>
              </Link>
            )}
            
            {/* Mobile Nav Toggle */}
            <button 
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileNavOpen}
              aria-controls="mobile-navigation"
              className="lg:hidden h-11 w-11 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 shadow-sm"
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <div id="mobile-navigation" className={`lg:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-lg z-40 transition-all duration-300 ${isMobileNavOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-4'}`}>
         <div className="flex flex-col p-4 space-y-2">
            <Link href="/ecode-library" onClick={() => setIsMobileNavOpen(false)} className="px-4 py-3 text-sm font-black uppercase tracking-widest text-slate-500 bg-slate-50 rounded-xl flex items-center gap-3">
              <FileText className="w-4 h-4" /> Ecode Library
            </Link>
            <Link href="/professional-registry" onClick={() => setIsMobileNavOpen(false)} className="px-4 py-3 text-sm font-black uppercase tracking-widest text-brand-gold bg-amber-50 rounded-xl flex items-center gap-3">
              <Layers className="w-4 h-4" /> Need to hire a professional?
            </Link>
            <button 
              onClick={() => {
                setIsMobileNavOpen(false);
                setFeedbackInitialType('General Feedback');
                setIsFeedbackOpen(true);
              }}
              className="px-4 py-3 text-sm font-black uppercase tracking-widest text-slate-500 bg-slate-50 rounded-xl flex items-center gap-3 w-full text-left"
            >
              <MessageSquare className="w-4 h-4" /> Give Feedback
            </button>
            {!user && (
               <Link href="/pricing" onClick={() => setIsMobileNavOpen(false)} className="px-4 py-3 text-sm font-black uppercase tracking-widest text-white bg-brand-ocean rounded-xl flex items-center gap-3 mt-2 shadow-md">
                 Go Pro
               </Link>
            )}
         </div>
      </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 flex relative overflow-hidden bg-slate-50 flex-col lg:flex-row">
        {/* Mobile Search Bar (Only visible on small screens) */}
        <div className="p-4 bg-white border-b border-slate-100 md:hidden z-30">
          <SearchBar />
        </div>

        {/* Desktop Filter Toggle Button */}
        {!isFilterOpen && (
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="hidden lg:flex absolute top-8 left-8 z-20 glass-panel px-5 py-3 rounded-2xl border-white/60 bg-white/70 backdrop-blur-2xl shadow-premium hover:bg-white transition-all items-center gap-3 group active:scale-95"
          >
            <Filter className="w-4 h-4 text-brand-slate group-hover:text-brand-ocean transition-colors" />
            <span className="text-xs font-black text-brand-slate group-hover:text-brand-ocean tracking-widest uppercase transition-colors pt-0.5">Filters</span>
          </button>
        )}

        {/* Left Floating Filter Panel */}
        <div className={`absolute top-20 lg:top-8 left-4 lg:left-8 z-20 w-[calc(100%-2rem)] sm:w-80 space-y-4 transition-all duration-300 ${
          isFilterOpen ? 'translate-x-0 opacity-100 visible' : '-translate-x-10 opacity-0 invisible'
        }`}>
          {/* Map Controls Card */}
          <div className="glass-panel rounded-[2.5rem] p-8 flex flex-col gap-6 shadow-premium border-white/60 bg-white/70 backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/50">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-brand-slate/5 rounded-xl">
                  <Filter className="w-4 h-4 text-brand-slate" />
                </div>
                <h2 className="text-xs font-black text-brand-slate uppercase tracking-[0.2em]">Zoning Filters</h2>
              </div>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center"
                title="Collapse Filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-4 cursor-pointer group hover:bg-brand-emerald/5 p-2 rounded-2xl transition-all border border-transparent hover:border-brand-emerald/10">
                <input 
                  type="checkbox" 
                  checked={activeFilters.includes('RESIDENTIAL')} 
                  onChange={() => toggleFilter('RESIDENTIAL')}
                  className="w-5 h-5 rounded-lg text-brand-emerald border-slate-300 focus:ring-brand-emerald cursor-pointer transition-all" 
                />
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-700 group-hover:text-brand-slate transition-colors tracking-tight">Residential</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-1">Housing & Dwellings</span>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-brand-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </label>

              <label className="flex items-center gap-4 cursor-pointer group hover:bg-brand-ocean/5 p-2 rounded-2xl transition-all border border-transparent hover:border-brand-ocean/10">
                <input 
                  type="checkbox" 
                  checked={activeFilters.includes('COMMERCIAL')} 
                  onChange={() => toggleFilter('COMMERCIAL')}
                  className="w-5 h-5 rounded-lg text-brand-ocean border-slate-300 focus:ring-brand-ocean cursor-pointer transition-all" 
                />
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-700 group-hover:text-brand-slate transition-colors tracking-tight">Commercial</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-1">Retail & Business</span>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-brand-ocean shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
              </label>

              <label className="flex items-center gap-4 cursor-pointer group hover:bg-brand-purple/5 p-2 rounded-2xl transition-all border border-transparent hover:border-brand-purple/10">
                <input 
                  type="checkbox" 
                  checked={activeFilters.includes('MIXED')} 
                  onChange={() => toggleFilter('MIXED')}
                  className="w-5 h-5 rounded-lg text-brand-purple border-slate-300 focus:ring-brand-purple cursor-pointer transition-all" 
                />
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-700 group-hover:text-brand-slate transition-colors tracking-tight">Mixed-use</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-1">Integrated Districts</span>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-brand-purple shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
              </label>

              <label className="flex items-center gap-4 cursor-pointer group hover:bg-orange-500/5 p-2 rounded-2xl transition-all border border-transparent hover:border-orange-500/10">
                <input 
                  type="checkbox" 
                  checked={activeFilters.includes('INDUSTRIAL')} 
                  onChange={() => toggleFilter('INDUSTRIAL')}
                  className="w-5 h-5 rounded-lg text-orange-500 border-slate-300 focus:ring-orange-500 cursor-pointer transition-all" 
                />
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-700 group-hover:text-brand-slate transition-colors tracking-tight">Industrial</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-1">Manufacturing & Plants</span>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              </label>

            </div>

            <div className="mt-2 pt-4 border-t border-slate-100/50 text-center">
              <p className="text-[10px] font-bold text-slate-400 leading-normal tracking-wide">
                Click a specific zone or use search for requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="lg:hidden absolute bottom-24 left-1/2 -translate-x-1/2 z-20 bg-brand-slate text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-2 active:scale-95 transition-all"
        >
          <Filter className="w-3.5 h-3.5" />
          {isFilterOpen ? 'Close Filters' : 'Filter Zones'}
        </button>

        {/* The Map Component */}
        <div className="flex-1 relative">
          <MapComponent />
        </div>

        <RightPanel onReportDataIssue={() => {
          setFeedbackInitialType('Incorrect Zoning Data');
          setIsFeedbackOpen(true);
        }} />
      </main>

      {/* Onboarding / Demo Modal */}
      <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />

      {/* Feedback & Bug Reporting Modal */}
      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)}
        initialType={feedbackInitialType}
        propertyDetails={selectedProperty}
      />
    </div>
  );
}
