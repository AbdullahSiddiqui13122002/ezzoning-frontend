"use client";
 
import { ArrowLeft, BookOpen, ExternalLink, Building2, Loader2, AlertCircle, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
 
interface District {
  id: string;
  name: string;
  zones: { ecodeLink: string | null; ordinanceUrl: string | null }[];
}
 
export default function EcodeLibrary() {
  const [departments, setDepartments] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/districts`);
        if (!response.ok) {
          throw new Error('Failed to fetch districts');
        }
        const data = await response.json();
        setDepartments(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
 
    fetchDistricts();
  }, []);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter districts
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDepartments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
 
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 selection:bg-brand-ocean/20">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand-ocean transition-all px-4 py-2 hover:bg-brand-ocean/5 rounded-xl">
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </Link>
          
          <div className="flex items-center gap-4">
             <div className="bg-brand-ocean/10 p-2.5 rounded-xl shadow-sm border border-brand-ocean/20">
               <BookOpen className="w-5 h-5 text-brand-ocean" />
             </div>
             <h1 className="text-2xl font-black text-brand-slate tracking-tighter uppercase italic pt-1">ezZoning <span className="text-xs font-black text-slate-400 not-italic tracking-[0.2em] ml-1">Library</span></h1>
          </div>
        </div>
      </nav>
 
      <main className="max-w-6xl mx-auto px-8 pt-20 space-y-12">
        
        {/* Header Section */}
        <section className="text-center space-y-6">
          <h2 className="text-5xl font-black text-brand-slate tracking-tight italic uppercase">
            Official <span className="text-brand-ocean">E-Code</span> Registry
          </h2>
          <p className="max-w-2xl mx-auto text-slate-500 font-medium text-lg leading-relaxed">
             Direct access to the official zoning codes and building department regulations for all municipalities serviced by our platform.
          </p>
        </section>

        {/* Search Filter Bar */}
        {!loading && !error && departments.length > 0 && (
          <div className="max-w-md mx-auto relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
              <Search className="w-5 h-5 text-brand-ocean" />
            </div>
            <input
              type="text"
              placeholder="Search districts by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-10 bg-white border border-slate-200/80 rounded-2xl text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:border-brand-ocean transition-all group-hover:border-slate-300"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
 
        {/* Directory Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-4">
          
          {loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-brand-ocean mb-4" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Registries...</p>
            </div>
          )}
 
          {error && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-rose-50 border border-rose-100 rounded-[2.5rem]">
              <AlertCircle className="w-10 h-10 text-rose-400 mb-4" />
              <p className="text-xs font-black text-rose-500 uppercase tracking-widest text-center max-w-md">{error}</p>
            </div>
          )}
 
          {!loading && !error && filteredDepartments.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
              <div className="bg-slate-50 p-4 rounded-2xl mb-4">
                <BookOpen className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">No Registries Found</h3>
              <p className="text-sm font-medium text-slate-400 mt-2 text-center max-w-sm">
                {searchQuery ? "Try refining your search query to locate the district." : "Districts will automatically appear here once they are uploaded via the Admin panel."}
              </p>
            </div>
          )}
 
          {!loading && !error && currentItems.map((dept) => {
            // Grab the first available eCodeLink or ordinanceUrl from the district's zones
            const link = dept.zones?.find(z => z.ecodeLink)?.ecodeLink || dept.zones?.find(z => z.ordinanceUrl)?.ordinanceUrl;
            const hasLink = !!link;
 
            return (
              <a 
                 key={dept.id} 
                 href={hasLink ? link : "#"} 
                 target={hasLink ? "_blank" : undefined} 
                 rel={hasLink ? "noopener noreferrer" : undefined}
                 className={`bg-white border border-slate-100 rounded-[2.5rem] p-10 transition-all duration-500 flex flex-col justify-between min-h-[220px] relative overflow-hidden group ${
                   hasLink ? "hover:border-brand-ocean hover:shadow-premium hover:-translate-y-2 cursor-pointer" : "opacity-60 cursor-not-allowed hover:bg-slate-50"
                 }`}
                 title={!hasLink ? "E-Code link not available for this district yet." : undefined}
              >
                 <div className={`absolute top-0 right-0 w-24 h-24 bg-brand-ocean/5 rounded-full blur-3xl -mr-12 -mt-12 transition-colors duration-500 ${hasLink ? "group-hover:bg-brand-ocean/10" : ""}`} />
                 
                 <div className="flex items-start justify-between relative z-10">
                    <div className={`p-4 rounded-2xl shadow-inner transition-all duration-500 ${hasLink ? "bg-slate-50 group-hover:bg-brand-ocean/10 group-hover:shadow-none" : "bg-slate-100"}`}>
                       <Building2 className={`w-8 h-8 transition-all duration-500 ${hasLink ? "text-slate-300 group-hover:text-brand-ocean" : "text-slate-300"}`} />
                    </div>
                    <div className={`p-2.5 rounded-xl shadow-sm transition-all duration-500 ${hasLink ? "bg-slate-50 group-hover:bg-brand-ocean text-slate-300 group-hover:text-white" : "bg-slate-100 text-slate-300"}`}>
                       <ExternalLink className="w-4 h-4" />
                    </div>
                 </div>
                 <div className="relative z-10 mt-8">
                    <h3 className={`text-xl font-black tracking-tight transition-colors duration-500 ${hasLink ? "text-brand-slate group-hover:text-brand-ocean" : "text-slate-400"}`}>{dept.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 transition-colors">
                      {hasLink ? "View Digital Ordinance \u2192" : "No Link Available"}
                    </p>
                 </div>
              </a>
            );
          })}
        </section>

        {/* Pagination Controls */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-100/80 pt-10 pb-20">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredDepartments.length)} of {filteredDepartments.length} districts
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-3 bg-white border border-slate-200/80 rounded-2xl hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center h-10 w-10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Generate Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (totalPages > 6 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                  if (page === 2 || page === totalPages - 1) {
                    return (
                      <span key={`ellipsis-${page}`} className="px-2 text-slate-400 font-bold text-xs select-none">...</span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-2xl font-black text-xs transition-all flex items-center justify-center shadow-sm ${
                      currentPage === page
                        ? "bg-brand-ocean text-white shadow-brand-ocean/20"
                        : "bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 hover:text-brand-ocean"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-3 bg-white border border-slate-200/80 rounded-2xl hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center h-10 w-10"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
      </main>
    </div>
  );
}
