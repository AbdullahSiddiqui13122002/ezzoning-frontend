"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, Filter, Map as MapIcon, Loader2, Edit2, Trash2, X, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface District {
  id: string;
  name: string;
  type: string;
  zones: any[];
}

export default function DistrictsPage() {
  const [mounted, setMounted] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isDeveloper, setIsDeveloper] = useState(false);

  // Modal states
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);
  const [deletingDistrict, setDeletingDistrict] = useState<District | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDistricts = () => {
    setLoading(true);
    const token = localStorage.getItem('admin_token');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/districts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('admin_token');
          window.location.href = '/admin/login';
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
            setDistricts(data);
        } else {
            console.error("Server returned an error:", data);
            setDistricts([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch districts:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    const userStr = localStorage.getItem('admin_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.email === 'developer@ezzoning.com') {
          setIsDeveloper(true);
        }
      } catch (e) {}
    }
    fetchDistricts();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDistrict) return;

    setIsUpdating(true);
    const token = localStorage.getItem('admin_token');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/districts/${editingDistrict.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingDistrict.name,
          type: editingDistrict.type
        })
      });

      if (res.ok) {
        setEditingDistrict(null);
        fetchDistricts();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update district");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("An error occurred while updating the district");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDistrict) return;

    setIsDeleting(true);
    const token = localStorage.getItem('admin_token');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/districts/${deletingDistrict.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setDeletingDistrict(null);
        fetchDistricts();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete district");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("An error occurred while deleting the district");
    } finally {
      setIsDeleting(false);
    }
  };

  const uniqueTypes = ["ALL", ...Array.from(new Set(districts.map(d => d.type)))];

  const filteredDistricts = districts.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === "ALL" || d.type === filterType;
      return matchesSearch && matchesFilter;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredDistricts.length / itemsPerPage);
  const paginatedDistricts = filteredDistricts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-8 relative">
      <div className="max-w-6xl mx-auto space-y-10 relative z-10 pt-10">
        
        {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-premium relative z-10">
            <div className="flex-1 w-full relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-standard pl-11 shadow-sm border-none bg-slate-50/50 text-slate-700 font-bold placeholder:text-slate-400"
                placeholder="Search districts..."
              />
            </div>
            <div className="relative w-full sm:w-56 shrink-0 border-l border-slate-100 pl-4">
              <div className="absolute inset-y-0 left-4 pl-4 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400" />
              </div>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-standard pl-11 pr-10 cursor-pointer appearance-none uppercase tracking-widest text-[10px] font-black border-none bg-slate-50/50 text-slate-700"
              >
                {uniqueTypes.map(type => (
                   <option key={type} value={type}>
                     {type === "ALL" ? "All Types" : type}
                   </option>
                ))}
              </select>
            </div>
            {!isDeveloper && (
              <div className="shrink-0">
                 <Link href="/admin/add-district" className="btn-primary px-6 py-3.5 flex items-center justify-center gap-2 group text-xs">
                   <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                   Add District
                 </Link>
              </div>
            )}
          </div>

        {/* Data Table */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-premium overflow-hidden relative min-h-[500px] flex flex-col">
          {loading && (
             <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-md z-10">
               <Loader2 className="w-10 h-10 text-brand-ocean animate-spin" />
             </div>
          )}
          
          <div className="flex-1 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-50">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-4 text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] w-16 border-r border-slate-200">
                    S. No.
                  </th>
                  <th scope="col" className="px-8 py-4 text-left text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] border-r border-slate-200">
                    District Name
                  </th>
                  <th scope="col" className="px-8 py-4 text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] border-r border-slate-200">
                    Type
                  </th>
                  <th scope="col" className="px-8 py-4 text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] border-r border-slate-200">
                    Zones
                  </th>
                  <th scope="col" className="px-8 py-4 text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {paginatedDistricts.length === 0 && !loading ? (
                   <tr>
                      <td colSpan={5} className="px-10 py-24 text-center">
                        <p className="text-lg font-black text-brand-slate tracking-tight">No districts found</p>
                      </td>
                   </tr>
                ) : (
                  paginatedDistricts.map((district, index) => (
                    <tr key={district.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-6 py-4 whitespace-nowrap border-r border-slate-100 text-center">
                        <span className="text-[11px] font-black text-slate-600 tabular-nums">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </span>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap border-r border-slate-100">
                        <span className="text-sm font-black text-slate-900 tracking-tight group-hover:text-brand-ocean transition-colors">{district.name}</span>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap border-r border-slate-100 text-center">
                        <span className={`px-3 py-1.5 inline-flex text-[9px] uppercase tracking-[0.2em] font-black rounded-lg border shadow-sm transition-all duration-300 ${
                          district.type === 'TOWN' ? 'bg-blue-50 text-blue-700 border-blue-200 group-hover:bg-blue-100' : 
                          district.type === 'VILLAGE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-100' : 
                          'bg-purple-50 text-purple-700 border-purple-200 group-hover:bg-purple-100'
                        }`}>
                          {district.type}
                        </span>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap border-r border-slate-100 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <span className="text-sm font-black text-slate-900">
                             {district.zones?.length || 0}
                           </span>
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registered</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/admin/districts/${district.id}`} className="p-2 bg-slate-100 text-slate-500 rounded-lg border border-slate-200 hover:border-brand-ocean hover:text-brand-ocean hover:bg-brand-ocean/5 transition-all" title="View Details">
                            <Search className="w-3.5 h-3.5" />
                          </Link>
                          <Link href={`/admin/districts/${district.id}/add-zone`} className="p-2 bg-slate-100 text-slate-500 rounded-lg border border-slate-200 hover:border-brand-emerald hover:text-brand-emerald hover:bg-brand-emerald/5 transition-all" title="Add Zone">
                            <Plus className="w-3.5 h-3.5" />
                          </Link>
                          <button 
                            onClick={() => setEditingDistrict(district)}
                            className="p-2 bg-slate-100 text-slate-500 rounded-lg border border-slate-200 hover:border-brand-ocean hover:text-brand-ocean hover:bg-brand-ocean/5 transition-all" 
                            title="Edit District"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!isDeveloper && (
                            <button 
                              onClick={() => setDeletingDistrict(district)}
                              className="p-2 bg-slate-100 text-slate-500 rounded-lg border border-slate-200 hover:border-rose-500 hover:text-rose-500 hover:bg-rose-50 transition-all" 
                              title="Delete District"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="bg-slate-50/30 px-8 py-4 border-t border-slate-50 flex items-center justify-between">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
               Page {currentPage} of {totalPages || 1} — {filteredDistricts.length} total
             </div>
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  Prev
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  Next
                </button>
             </div>
          </div>
        </div>

      </div>

      {/* Edit Modal */}
      {editingDistrict && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-premium w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 pt-8 pb-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-brand-slate tracking-tight">Edit District</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Update Registry Information</p>
              </div>
              <button onClick={() => setEditingDistrict(null)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">District Name</label>
                <input 
                  type="text"
                  required
                  value={editingDistrict.name}
                  onChange={(e) => setEditingDistrict({...editingDistrict, name: e.target.value})}
                  className="input-standard w-full bg-slate-50/50 border-transparent focus:border-brand-ocean/30 focus:bg-white transition-all font-bold text-slate-700"
                  placeholder="e.g. Town of Huntington"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location Type</label>
                <select 
                  required
                  value={editingDistrict.type}
                  onChange={(e) => setEditingDistrict({...editingDistrict, type: e.target.value})}
                  className="input-standard w-full bg-slate-50/50 border-transparent focus:border-brand-ocean/30 focus:bg-white transition-all font-bold text-slate-700 appearance-none uppercase tracking-widest text-[10px]"
                >
                  <option value="TOWN">Town</option>
                  <option value="VILLAGE">Village</option>
                  <option value="CITY">City</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingDistrict(null)}
                  className="flex-1 px-6 py-4 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUpdating}
                  className="flex-[2] btn-primary px-6 py-4 rounded-2xl text-[10px] flex items-center justify-center gap-2"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deletingDistrict && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-premium w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-brand-slate tracking-tight">Are you sure?</h3>
                <p className="text-xs font-bold text-slate-500 leading-relaxed px-4">
                  Deleting <span className="text-brand-slate underline decoration-rose-200 decoration-2 underline-offset-4">{deletingDistrict.name}</span> will permanently remove all associated zones and data.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Delete District"}
                </button>
                <button 
                  onClick={() => setDeletingDistrict(null)}
                  className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                >
                  Keep District
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
