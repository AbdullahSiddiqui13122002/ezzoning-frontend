"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Loader2, Map as MapIcon, Layers, FileText, Edit2, Trash2, X, AlertTriangle, Plus, Save, UploadCloud, Search, Filter } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

interface Zone {
  id: string;
  name: string;
  classification: string;
  description: string | null;
  ordinanceUrl: string | null;
  principalRequirements: any;
  accessoryRequirements: any;
  ecodeLink: string | null;
}

interface District {
  id: string;
  name: string;
  type: string;
  zones: Zone[];
}

export default function ViewDistrictPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [mounted, setMounted] = useState(false);
  const [district, setDistrict] = useState<District | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeveloper, setIsDeveloper] = useState(false);

  // Search & Filter state for zones
  const [zoneSearchQuery, setZoneSearchQuery] = useState("");
  const [zoneClassFilter, setZoneClassFilter] = useState("ALL");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Zone Modal states
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [deletingZone, setDeletingZone] = useState<Zone | null>(null);
  const [isUpdatingZone, setIsUpdatingZone] = useState(false);
  const [isDeletingZone, setIsDeletingZone] = useState(false);

  // Form states for Editing Zone
  const [editPrincipalReqs, setEditPrincipalReqs] = useState<{key: string, value: string}[]>([]);
  const [editAccessoryReqs, setEditAccessoryReqs] = useState<{key: string, value: string}[]>([]);
  const [ordinanceFile, setOrdinanceFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [geoJsonFile, setGeoJsonFile] = useState<File | null>(null);
  const [editGeoJsonData, setEditGeoJsonData] = useState<any>(null);
  const [isMunicipal, setIsMunicipal] = useState(false);

  const handleGeoJsonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setGeoJsonFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.type === 'Feature' || parsed.type === 'Polygon' || parsed.type === 'MultiPolygon' || parsed.type === 'FeatureCollection') {
            setEditGeoJsonData(parsed);
          } else {
            alert("Invalid GeoJSON. Must be a Feature, Polygon, MultiPolygon or FeatureCollection.");
            setGeoJsonFile(null);
            setEditGeoJsonData(null);
          }
        } catch (err) {
          alert("Failed to parse JSON. Please upload a valid JSON/GeoJSON file.");
          setGeoJsonFile(null);
          setEditGeoJsonData(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const fetchDistrict = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/districts/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setDistrict(data);
      } else {
        console.error("Failed to fetch district details");
      }
    } catch (err) {
      console.error("Error fetching district:", err);
    } finally {
      setLoading(false);
    }
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
    fetchDistrict();
  }, [id, router]);

  const openEditModal = (zone: Zone) => {
    setEditingZone(zone);
    const geoData = (zone as any).geoJsonData;
    setEditGeoJsonData(geoData || null);
    setGeoJsonFile(null);
    setIsMunicipal(geoData?.properties?.isMunicipal === true || zone.name.toLowerCase().includes('municipal') || zone.name.toLowerCase().includes('boundary'));
    
    // Transform JSON objects to key-value arrays for the form
    const pReqs = zone.principalRequirements ? 
      Object.entries(zone.principalRequirements).map(([key, value]) => ({ key, value: String(value) })) : 
      [];
    const aReqs = zone.accessoryRequirements ? 
      Object.entries(zone.accessoryRequirements).map(([key, value]) => ({ key, value: String(value) })) : 
      [];
      
    setEditPrincipalReqs(pReqs);
    setEditAccessoryReqs(aReqs);
  };

  const handleUpdateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone) return;

    setIsUpdatingZone(true);
    setUploadProgress(0);
    const token = localStorage.getItem('admin_token');

    try {
      let finalOrdinanceUrl = editingZone.ordinanceUrl;

      // Upload file if selected
      if (ordinanceFile) {
        setUploadProgress(10);
        const fileName = `${Date.now()}-${ordinanceFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('ordinances')
          .upload(fileName, ordinanceFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`PDF Upload Failed: ${uploadError.message}`);
        }
        
        setUploadProgress(50);
        const { data: { publicUrl } } = supabase.storage
          .from('ordinances')
          .getPublicUrl(uploadData.path);
          
        finalOrdinanceUrl = publicUrl;
      }

      setUploadProgress(70);

      // Transform arrays back to JSON objects
      const pJson: Record<string, string> = {};
      editPrincipalReqs.forEach(req => { if (req.key && req.value) pJson[req.key] = req.value; });
      
      const aJson: Record<string, string> = {};
      editAccessoryReqs.forEach(req => { if (req.key && req.value) aJson[req.key] = req.value; });

      setUploadProgress(90);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/zones/${editingZone.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editingZone,
          ordinanceUrl: finalOrdinanceUrl,
          principalRequirements: pJson,
          accessoryRequirements: aJson,
          geoJsonData: editGeoJsonData || null,
          isMunicipal
        })
      });

      if (res.ok) {
        setEditingZone(null);
        setOrdinanceFile(null);
        fetchDistrict();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update zone");
      }
    } catch (err: any) {
      console.error("Update error:", err);
      alert(err.message || "An error occurred while updating the zone");
    } finally {
      setIsUpdatingZone(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteZone = async () => {
    if (!deletingZone) return;

    setIsDeletingZone(true);
    const token = localStorage.getItem('admin_token');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/zones/${deletingZone.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setDeletingZone(null);
        fetchDistrict();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete zone");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("An error occurred while deleting the zone");
    } finally {
      setIsDeletingZone(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-8 pb-8 relative flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-ocean animate-spin" />
      </div>
    );
  }

  if (!district) {
    return (
      <div className="flex-1 overflow-y-auto px-8 pb-8 relative flex items-center justify-center flex-col gap-4">
        <h2 className="text-2xl font-black text-brand-slate uppercase italic">District Not Found</h2>
        <Link href="/admin/districts" className="btn-primary px-6 py-3">Return to Registry</Link>
      </div>
    );
  }

  const formatKey = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1').trim();
  };

  const renderRequirementCards = (reqs: any) => {
    if (!reqs || typeof reqs !== 'object') return null;
    return (
      <div className="grid grid-cols-2 gap-3 mt-3">
        {Object.entries(reqs).map(([key, value]) => (
          <div key={key} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-brand-ocean/30 transition-all group/card">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover/card:text-brand-ocean transition-colors">
              {formatKey(key)}
            </div>
            <div className="text-sm font-black text-slate-900 truncate" title={String(value)}>
              {String(value)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-8 relative">
      <div className="max-w-6xl mx-auto space-y-10 relative z-10 pt-10">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between bg-white p-4 rounded-[2rem] border border-slate-200 shadow-premium relative z-10">
          <Link href="/admin/districts" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-ocean transition-all px-4 py-2 hover:bg-slate-50 rounded-xl">
            <ArrowLeft className="w-4 h-4" />
            Back to Registry
          </Link>
          <Link href={`/admin/districts/${district.id}/add-zone`} className="btn-outline px-6 py-2.5 text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 border-slate-200 hover:border-brand-ocean hover:text-brand-ocean hover:bg-brand-ocean/5 transition-all">
            Add Zone
          </Link>
        </div>

        {/* District Overview Card */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-premium relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="relative z-10">
               <h1 className="text-4xl font-black text-brand-slate tracking-tight">{district.name}</h1>
               <div className="flex items-center gap-4 mt-4">
                 <span className={`px-4 py-1.5 inline-flex text-[10px] uppercase tracking-[0.2em] font-black rounded-xl border shadow-sm ${
                   district.type === 'TOWN' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                   district.type === 'VILLAGE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                   'bg-purple-50 text-purple-700 border-purple-200'
                 }`}>
                   {district.type}
                 </span>
               </div>
            </div>
            <div className="relative z-10 bg-slate-50 border border-slate-100 p-6 rounded-3xl flex items-center gap-6 shrink-0">
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-brand-ocean">
                 <Layers className="w-8 h-8" />
               </div>
               <div>
                  <div className="text-4xl font-black text-brand-slate tracking-tighter">{district.zones.length}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Total Zones</div>
               </div>
            </div>
            
            <div className="absolute right-0 top-0 w-64 h-64 bg-brand-ocean/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
        </div>

        {/* Zones List */}
        <div>
           {/* Header Controls for Search and Sort */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                 <h2 className="text-xl font-black text-brand-slate tracking-tight uppercase italic">District <span className="text-brand-ocean">Zones</span></h2>
                 {district.zones.length > 0 && (
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                       Showing {district.zones.filter(z => 
                          z.name.toLowerCase().includes(zoneSearchQuery.toLowerCase()) && 
                          (zoneClassFilter === "ALL" || z.classification === zoneClassFilter)
                       ).length} of {district.zones.length} Zones
                    </p>
                 )}
              </div>

              {district.zones.length > 0 && (
                 <div className="flex flex-wrap items-center gap-3">
                    {/* Search by Zone Name */}
                    <div className="relative w-full sm:w-64">
                       <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                       <input
                          type="text"
                          placeholder="Search zone by name..."
                          value={zoneSearchQuery}
                          onChange={(e) => setZoneSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium focus:border-brand-ocean focus:outline-none shadow-sm transition-all"
                       />
                       {zoneSearchQuery && (
                          <button 
                             onClick={() => setZoneSearchQuery("")}
                             className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                             <X className="w-3.5 h-3.5" />
                          </button>
                       )}
                    </div>

                    {/* Sort / Filter by Zone Classification */}
                    <div className="relative">
                       <select
                          value={zoneClassFilter}
                          onChange={(e) => setZoneClassFilter(e.target.value)}
                          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 uppercase tracking-wider focus:border-brand-ocean focus:outline-none shadow-sm cursor-pointer transition-all appearance-none pr-9"
                       >
                          <option value="ALL">All Types</option>
                          <option value="RESIDENTIAL">Residential</option>
                          <option value="COMMERCIAL">Commercial</option>
                          <option value="MIXED">Mixed-use</option>
                          <option value="INDUSTRIAL">Industrial</option>
                          <option value="OTHER">Other / District-wide</option>
                       </select>
                       <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                 </div>
              )}
           </div>

           {district.zones.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-premium p-16 text-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <MapIcon className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">No Zones Configured</h3>
                 <p className="text-sm font-bold text-slate-500 mt-2 mb-8 max-w-sm mx-auto">This district doesn't have any zoning boundaries defined yet.</p>
                 <Link href={`/admin/districts/${district.id}/add-zone`} className="btn-primary inline-flex">
                   Configure First Zone
                 </Link>
              </div>
           ) : (() => {
              const filteredZones = district.zones.filter((zone) => {
                 const matchesName = zone.name.toLowerCase().includes(zoneSearchQuery.toLowerCase());
                 const matchesClass = zoneClassFilter === "ALL" || zone.classification === zoneClassFilter;
                 return matchesName && matchesClass;
              });

              if (filteredZones.length === 0) {
                 return (
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-premium p-16 text-center">
                       <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                          <Search className="w-8 h-8" />
                       </div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight">No Matching Zones</h3>
                       <p className="text-sm font-bold text-slate-500 mt-2 mb-6 max-w-sm mx-auto">No zones match your current search query or classification filter.</p>
                       <button 
                          onClick={() => { setZoneSearchQuery(""); setZoneClassFilter("ALL"); }}
                          className="btn-outline px-6 py-2.5 text-xs font-black uppercase tracking-widest inline-flex"
                       >
                          Clear Filters
                       </button>
                    </div>
                 );
              }

              return (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredZones.map((zone) => (
                    <div key={zone.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-premium hover:shadow-2xl hover:border-brand-ocean/30 hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden flex flex-col">
                        
                        <div className="flex justify-between items-start mb-4 relative z-10">
                           <div className="flex-1">
                              <h3 className="text-2xl font-black text-brand-slate tracking-tight pr-12">{zone.name}</h3>
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-ocean mt-1 block">Class: {zone.classification}</span>
                           </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => openEditModal(zone)}
                                className="p-2 bg-slate-50 text-slate-400 rounded-lg border border-slate-100 hover:text-brand-ocean hover:border-brand-ocean hover:bg-brand-ocean/5 transition-all shadow-sm"
                                title="Edit Zone"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {!isDeveloper && (
                                <button 
                                  onClick={() => setDeletingZone(zone)}
                                  className="p-2 bg-slate-50 text-slate-400 rounded-lg border border-slate-100 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm"
                                  title="Delete Zone"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 items-end relative z-10 mb-6">
                             {zone.ecodeLink ? (
                                 <a href={zone.ecodeLink} target="_blank" rel="noopener noreferrer" className="bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm hover:text-brand-ocean hover:border-brand-ocean transition-all flex items-center gap-2">
                                    eCode Link
                                 </a>
                             ) : (
                                 <span className="bg-slate-50/50 text-slate-400 border border-slate-100 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 cursor-not-allowed">
                                    No eCode Link
                                 </span>
                             )}
                             
                             {zone.ordinanceUrl ? (
                                 <a href={zone.ordinanceUrl} target="_blank" rel="noopener noreferrer" className="bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm hover:text-brand-ocean hover:border-brand-ocean transition-all flex items-center gap-2">
                                    <FileText className="w-3 h-3" /> Ordinance
                                 </a>
                             ) : (
                                 <span className="bg-slate-50/50 text-slate-400 border border-slate-100 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 cursor-not-allowed">
                                    <FileText className="w-3 h-3 opacity-50" /> No Ordinance
                                 </span>
                             )}
                        </div>

                       {zone.description && (
                          <div className="mb-6 relative z-10">
                              <p className="text-sm font-medium text-slate-600 leading-relaxed">{zone.description}</p>
                          </div>
                       )}

                       <div className="grid grid-cols-1 gap-6 relative z-10 flex-1">
                          {zone.principalRequirements && Object.keys(zone.principalRequirements).length > 0 && (
                              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-inner">
                                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200/60 pb-2 mb-2">
                                    <FileText className="w-3.5 h-3.5 text-brand-ocean" /> Principal Requirements
                                 </div>
                                 {renderRequirementCards(zone.principalRequirements)}
                              </div>
                          )}
                          
                          {zone.accessoryRequirements && Object.keys(zone.accessoryRequirements).length > 0 && (
                              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-inner">
                                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200/60 pb-2 mb-2">
                                    <Layers className="w-3.5 h-3.5 text-brand-ocean" /> Accessory Requirements
                                 </div>
                                 {renderRequirementCards(zone.accessoryRequirements)}
                              </div>
                          )}
                       </div>

                       <div className="absolute inset-0 bg-gradient-to-br from-brand-ocean/0 via-transparent to-brand-ocean/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    </div>
                 ))}
              </div>
           )})()}
        </div>

      </div>

      {/* Edit Zone Modal */}
      {editingZone && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            {/* Modal Fixed Header */}
            <div className="px-8 pt-8 pb-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-xl font-black text-brand-slate tracking-tight">Edit Zone Details</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Refine Zoning Constraints</p>
              </div>
              <button onClick={() => setEditingZone(null)} className="p-2.5 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateZone} className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Zone Name</label>
                  <input 
                    type="text"
                    required
                    value={editingZone.name}
                    onChange={(e) => setEditingZone({...editingZone, name: e.target.value})}
                    className="input-standard w-full bg-slate-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Classification</label>
                  <select 
                    required
                    value={editingZone.classification}
                    onChange={(e) => setEditingZone({...editingZone, classification: e.target.value})}
                    className="input-standard w-full bg-slate-50/50 appearance-none uppercase tracking-widest text-[10px]"
                  >
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="MIXED">Mixed-use</option>
                    <option value="INDUSTRIAL">Industrial</option>
                    <option value="OTHER">Other / District-wide</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ecode Link</label>
                  <input 
                    type="url"
                    value={editingZone.ecodeLink || ""}
                    onChange={(e) => setEditingZone({...editingZone, ecodeLink: e.target.value})}
                    className="input-standard w-full bg-slate-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ordinance PDF</label>
                  <div className="relative group">
                    <input 
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setOrdinanceFile(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="input-standard w-full bg-slate-50/50 flex items-center gap-2 group-hover:border-brand-ocean/30 transition-all">
                      <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-brand-ocean" />
                      <span className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-wider">
                        {ordinanceFile ? ordinanceFile.name : (editingZone.ordinanceUrl ? "Replace Ordinance" : "Upload Ordinance")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GeoJSON Bounding Overlay</label>
                <div className="relative group">
                  <input 
                    type="file"
                    accept=".geojson,.json"
                    onChange={handleGeoJsonChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="input-standard w-full bg-slate-50/50 flex items-center gap-2 group-hover:border-brand-ocean/30 transition-all">
                    <Layers className="w-4 h-4 text-slate-400 group-hover:text-brand-ocean" />
                    <span className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-wider">
                      {geoJsonFile ? geoJsonFile.name : (editGeoJsonData ? "Replace GeoJSON Overlay" : "Upload GeoJSON Overlay")}
                    </span>
                  </div>
                </div>
                {geoJsonFile && (
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Valid GeoJSON Loaded: {geoJsonFile.name}
                  </p>
                )}
              </div>

              <div className="space-y-2 flex items-center gap-3 bg-slate-50/60 p-4 rounded-[1.5rem] border border-slate-200/50">
                <input
                    type="checkbox"
                    id="editIsMunicipal"
                    checked={isMunicipal}
                    onChange={(e) => setIsMunicipal(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-brand-ocean focus:ring-brand-ocean cursor-pointer"
                />
                <div className="flex flex-col">
                   <label htmlFor="editIsMunicipal" className="text-xs font-black text-slate-700 cursor-pointer">
                      Is Municipal / District Fallback Boundary
                   </label>
                   <span className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      Check this if the uploaded GeoJSON boundary represents the entire city, town, or village outline rather than a single zoning class.
                   </span>
                </div>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-brand-ocean h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">General Description</label>
                <textarea 
                  value={editingZone.description || ""}
                  onChange={(e) => setEditingZone({...editingZone, description: e.target.value})}
                  className="input-standard w-full bg-slate-50/50 min-h-[100px] py-3 font-medium"
                />
              </div>

              {/* Dimensional Requirements Section */}
              <div className="space-y-6 pt-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-ocean" />
                    Dimensional Constraints
                 </h4>

                 {/* Principal Building */}
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Principal Building</span>
                       <button type="button" onClick={() => setEditPrincipalReqs([...editPrincipalReqs, {key: "", value: ""}])} className="p-1.5 text-brand-ocean hover:bg-brand-ocean/5 rounded-lg transition-all">
                          <Plus className="w-4 h-4" />
                       </button>
                    </div>
                    {editPrincipalReqs.map((req, idx) => (
                       <div key={idx} className="flex gap-3">
                          <input 
                            placeholder="Constraint" 
                            value={req.key} 
                            onChange={(e) => {
                               const n = [...editPrincipalReqs];
                               n[idx].key = e.target.value;
                               setEditPrincipalReqs(n);
                            }}
                            className="input-standard flex-1 text-xs bg-white"
                          />
                          <input 
                            placeholder="Value" 
                            value={req.value} 
                            onChange={(e) => {
                               const n = [...editPrincipalReqs];
                               n[idx].value = e.target.value;
                               setEditPrincipalReqs(n);
                            }}
                            className="input-standard flex-1 text-xs bg-white"
                          />
                          <button type="button" onClick={() => setEditPrincipalReqs(editPrincipalReqs.filter((_, i) => i !== idx))} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    ))}
                 </div>

                 {/* Accessory Building */}
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessory Building</span>
                       <button type="button" onClick={() => setEditAccessoryReqs([...editAccessoryReqs, {key: "", value: ""}])} className="p-1.5 text-brand-emerald hover:bg-brand-emerald/5 rounded-lg transition-all">
                          <Plus className="w-4 h-4" />
                       </button>
                    </div>
                    {editAccessoryReqs.map((req, idx) => (
                       <div key={idx} className="flex gap-3">
                          <input 
                            placeholder="Constraint" 
                            value={req.key} 
                            onChange={(e) => {
                               const n = [...editAccessoryReqs];
                               n[idx].key = e.target.value;
                               setEditAccessoryReqs(n);
                            }}
                            className="input-standard flex-1 text-xs bg-white"
                          />
                          <input 
                            placeholder="Value" 
                            value={req.value} 
                            onChange={(e) => {
                               const n = [...editAccessoryReqs];
                               n[idx].value = e.target.value;
                               setEditAccessoryReqs(n);
                            }}
                            className="input-standard flex-1 text-xs bg-white"
                          />
                          <button type="button" onClick={() => setEditAccessoryReqs(editAccessoryReqs.filter((_, i) => i !== idx))} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="flex gap-3 pt-6 sticky bottom-0 bg-white">
                <button 
                  type="button"
                  onClick={() => setEditingZone(null)}
                  className="flex-1 px-6 py-4 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUpdatingZone}
                  className="flex-[2] btn-primary px-6 py-4 rounded-2xl text-[10px] flex items-center justify-center gap-2"
                >
                  {isUpdatingZone ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Zone Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Zone Confirmation Modal */}
      {deletingZone && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-premium w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-brand-slate tracking-tight">Delete Zone?</h3>
                <p className="text-xs font-bold text-slate-500 leading-relaxed px-4">
                  Are you sure you want to remove <span className="text-brand-slate underline decoration-rose-200 decoration-2 underline-offset-4">{deletingZone.name}</span>? This action cannot be undone.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={handleDeleteZone}
                  disabled={isDeletingZone}
                  className="w-full py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
                >
                  {isDeletingZone ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Permanently"}
                </button>
                <button 
                  onClick={() => setDeletingZone(null)}
                  className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                >
                  Cancel
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
