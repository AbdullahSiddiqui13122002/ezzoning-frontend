"use client";

import { Search, Filter, FileText, UploadCloud, MoreVertical } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-8 relative">
      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-brand-slate tracking-tight">E-Code Documents</h1>
            <p className="text-slate-500 mt-2 font-medium">Upload and manage zoning PDFs for OCR processing.</p>
          </div>
          <button className="btn-secondary px-6 flex items-center gap-3 group">
            <UploadCloud className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
            Upload PDF
          </button>
        </div>

        {/* Upload Zone */}
        <div className="border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center hover:bg-white hover:border-brand-ocean hover:shadow-premium transition-all cursor-pointer group bg-slate-50/50">
            <div className="w-20 h-20 bg-brand-ocean/10 text-brand-ocean rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-brand-ocean group-hover:text-white transition-all duration-500 shadow-lg shadow-brand-ocean/10">
                <UploadCloud className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-brand-slate tracking-tight">Click to upload or drag and drop</h3>
            <p className="text-sm font-bold text-slate-400 mt-3 uppercase tracking-widest">SVG, PNG, JPG or PDF (max. 50MB)</p>
        </div>

        {/* Document Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
            
            {[
                { name: "Town_of_Islip_Zoning_Code.pdf", size: "4.2 MB", date: "May 2, 2026", status: "Indexed" },
                { name: "Babylon_Residential_Reqs.pdf", size: "1.8 MB", date: "May 1, 2026", status: "Indexed" },
                { name: "Huntington_Commercial.pdf", size: "8.4 MB", date: "Apr 28, 2026", status: "Processing..." },
            ].map((doc, i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-premium hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-slate-50 p-4 rounded-2xl text-slate-300 group-hover:text-brand-ocean group-hover:bg-brand-ocean/10 transition-all duration-300 shadow-inner">
                            <FileText className="w-8 h-8" />
                        </div>
                        <button className="p-2 rounded-xl text-slate-300 hover:text-brand-slate hover:bg-slate-50 transition-all">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <h4 className="text-base font-black text-brand-slate tracking-tight truncate mb-2 group-hover:text-brand-ocean transition-colors" title={doc.name}>{doc.name}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{doc.size} • Uploaded {doc.date}</p>
                    
                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <span className={`text-[9px] uppercase tracking-[0.2em] font-black px-3 py-1.5 rounded-lg shadow-sm border ${
                            doc.status === 'Indexed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                            {doc.status}
                        </span>
                        <button className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-ocean hover:text-brand-slate transition-colors bg-brand-ocean/5 px-4 py-2 rounded-lg">View OCR</button>
                    </div>
                </div>
            ))}

        </div>

      </div>
    </div>
  );
}
