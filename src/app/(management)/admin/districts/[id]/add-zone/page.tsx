"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Save, Plus, Trash2, Link as LinkIcon, FileText, UploadCloud, Layers } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/utils/supabase";

export default function AddZone() {
  const router = useRouter();
  const params = useParams();
  const districtId = params.id;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [classification, setClassification] = useState("RESIDENTIAL");
  const [ecodeLink, setEcodeLink] = useState("");
  const [ordinanceFile, setOrdinanceFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [geoJsonFile, setGeoJsonFile] = useState<File | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
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
            setGeoJsonData(parsed);
          } else {
            alert("Invalid GeoJSON. Must be a Feature, Polygon, MultiPolygon or FeatureCollection.");
            setGeoJsonFile(null);
            setGeoJsonData(null);
          }
        } catch (err) {
          alert("Failed to parse JSON. Please upload a valid JSON/GeoJSON file.");
          setGeoJsonFile(null);
          setGeoJsonData(null);
        }
      };
      reader.readAsText(file);
    }
  };

  // Dynamic Key-Value states for Requirements
  const [principalReqs, setPrincipalReqs] = useState<{key: string, value: string}[]>([
    { key: "Lot Area", value: "" },
    { key: "Lot Frontage", value: "" },
    { key: "Building Height", value: "" },
    { key: "Front Setback", value: "" },
    { key: "Side Setback", value: "" },
    { key: "Rear Setback", value: "" },
    { key: "Lot Coverage", value: "" },
    { key: "Building Area", value: "" },
    { key: "Floor Area Ratio", value: "" },
    { key: "Rear Yard Coverage", value: "" },
  ]);
  
  const [accessoryReqs, setAccessoryReqs] = useState<{key: string, value: string}[]>([
    { key: "Lot Area", value: "" },
    { key: "Lot Frontage", value: "" },
    { key: "Building Height", value: "" },
    { key: "Front Setback", value: "" },
    { key: "Side Setback", value: "" },
    { key: "Rear Setback", value: "" },
    { key: "Lot Coverage", value: "" },
    { key: "Building Area", value: "" },
    { key: "Floor Area Ratio", value: "" },
    { key: "Rear Yard Coverage", value: "" },
  ]);

  const handleAddPrincipalReq = () => setPrincipalReqs([...principalReqs, { key: "", value: "" }]);
  const handleRemovePrincipalReq = (index: number) => setPrincipalReqs(principalReqs.filter((_, i) => i !== index));
  
  const handleAddAccessoryReq = () => setAccessoryReqs([...accessoryReqs, { key: "", value: "" }]);
  const handleRemoveAccessoryReq = (index: number) => setAccessoryReqs(accessoryReqs.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      
      let finalOrdinanceUrl = "";

      // 1. If a file was selected, upload it to Supabase Storage first
      if (ordinanceFile) {
        setUploadProgress(10);
        // Clean the filename
        const fileName = `${Date.now()}-${ordinanceFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('ordinances') // Assumes a bucket named "ordinances" exists
          .upload(fileName, ordinanceFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`PDF Upload Failed: ${uploadError.message}`);
        }
        setUploadProgress(50);
        
        // 2. Get the public URL for the newly uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('ordinances')
          .getPublicUrl(uploadData.path);
          
        finalOrdinanceUrl = publicUrl;
      }

      setUploadProgress(70);

      // 3. Transform Arrays into Objects for JSON storage
      const principalJson: Record<string, string> = {};
      principalReqs.forEach(req => { if (req.key && req.value) principalJson[req.key] = req.value; });
      
      const accessoryJson: Record<string, string> = {};
      accessoryReqs.forEach(req => { if (req.key && req.value) accessoryJson[req.key] = req.value; });

      setUploadProgress(90);

      // 4. Save to PostgreSQL Database
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/zones`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          districtId, 
          name, 
          classification,
          ecodeLink,
          ordinanceUrl: finalOrdinanceUrl || null,
          principalRequirements: principalJson,
          accessoryRequirements: accessoryJson,
          geoJsonData: geoJsonData || null,
          isMunicipal
        }),
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
        return;
      }

      if (!res.ok) throw new Error("Failed to save zone data to database");

      router.push("/admin/districts");
      router.refresh();
      
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-8 relative">
      <div className="max-w-4xl mx-auto space-y-6 relative z-10 pt-6">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm relative z-10">
          <Link href={`/admin/districts/${districtId}`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-ocean transition-all px-4 py-2 hover:bg-slate-50 rounded-xl">
            <ChevronLeft className="w-4 h-4" />
            Back to District
          </Link>
          <div className="px-4">
             <span className="text-[10px] font-black text-brand-slate uppercase tracking-[0.2em] italic">Add Zone</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-sm font-bold flex items-center gap-3 relative z-10 shadow-inner">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              {error}
            </div>
          )}

          {/* Unified Form Card */}
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-8 relative overflow-hidden">
             
             <div className="mb-8 relative z-10 border-b border-slate-100 pb-6">
                <h2 className="text-2xl font-black text-brand-slate tracking-tight">Configure Zone</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Set the specific property restrictions and classifications for this new jurisdiction.</p>
             </div>

             {/* Core Designation Section */}
             <div className="space-y-6 relative z-10">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                   <div className="w-1.5 h-1.5 rounded-full bg-brand-ocean" />
                   Core Designation
                </h3>
             
             <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 block">Zone Name Identifier</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-standard bg-slate-50/50"
                        placeholder="e.g., Residence District (R-5)"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 block">Classification Category</label>
                    <select
                        required
                        value={classification}
                        onChange={(e) => setClassification(e.target.value)}
                        className="input-standard bg-slate-50/50 cursor-pointer"
                    >
                        <option value="RESIDENTIAL">Residential</option>
                        <option value="COMMERCIAL">Commercial</option>
                        <option value="MIXED">Mixed-use</option>
                        <option value="INDUSTRIAL">Industrial</option>
                        <option value="OTHER">Other / District-wide</option>
                    </select>
                 </div>
                 
                 <div className="space-y-3 col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                        <LinkIcon className="w-3.5 h-3.5 text-brand-emerald" />
                        Ecode360 URL Link
                    </label>
                    <input
                        type="url"
                        value={ecodeLink}
                        onChange={(e) => setEcodeLink(e.target.value)}
                        className="input-standard bg-slate-50/50"
                        placeholder="https://ecode360.com/..."
                    />
                 </div>

                 <div className="space-y-3 col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                        <UploadCloud className="w-3.5 h-3.5 text-purple-500" />
                        PDF Ordinance Upload
                    </label>
                    <div className="border-2 border-dashed border-slate-200 rounded-[1.5rem] p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-50/50 hover:border-brand-ocean/30 transition-all group">
                        <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                setOrdinanceFile(e.target.files[0]);
                              }
                            }}
                            className="block w-full text-sm text-slate-500
                              file:mr-4 file:py-2.5 file:px-6
                              file:rounded-xl file:border-0
                              file:text-[10px] file:uppercase file:tracking-widest file:font-black
                              file:bg-brand-ocean/10 file:text-brand-ocean
                              hover:file:bg-brand-ocean/20 cursor-pointer transition-colors"
                        />
                        {ordinanceFile && (
                          <p className="mt-4 text-[10px] font-black text-slate-600 uppercase tracking-widest bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100">
                            Selected: {ordinanceFile.name} ({(ordinanceFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        )}
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="w-full mt-6 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-brand-ocean h-1.5 rounded-full transition-all duration-300 shadow-premium" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                        )}
                    </div>
                 </div>

                 <div className="space-y-3 col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-brand-ocean" />
                        GeoJSON Bounding Overlay Upload
                    </label>
                    <div className="border-2 border-dashed border-slate-200 rounded-[1.5rem] p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-50/50 hover:border-brand-ocean/30 transition-all group">
                        <input
                            type="file"
                            accept=".geojson,.json"
                            onChange={handleGeoJsonChange}
                            className="block w-full text-sm text-slate-500
                              file:mr-4 file:py-2.5 file:px-6
                              file:rounded-xl file:border-0
                              file:text-[10px] file:uppercase file:tracking-widest file:font-black
                              file:bg-brand-ocean/10 file:text-brand-ocean
                              hover:file:bg-brand-ocean/20 cursor-pointer transition-colors"
                        />
                        {geoJsonFile && (
                          <p className="mt-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Valid GeoJSON Loaded: {geoJsonFile.name}
                          </p>
                        )}
                    </div>
                 </div>

                 <div className="space-y-3 col-span-2 flex items-center gap-3 bg-slate-50/60 p-4 rounded-[1.5rem] border border-slate-200/50">
                    <input
                        type="checkbox"
                        id="isMunicipal"
                        checked={isMunicipal}
                        onChange={(e) => setIsMunicipal(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-brand-ocean focus:ring-brand-ocean cursor-pointer"
                    />
                    <div className="flex flex-col">
                       <label htmlFor="isMunicipal" className="text-xs font-black text-slate-700 cursor-pointer">
                          Is Municipal / District Fallback Boundary
                       </label>
                       <span className="text-[10px] text-slate-500 font-medium leading-relaxed">
                          Check this if the uploaded GeoJSON boundary represents the entire city, town, or village outline rather than a single zoning class.
                       </span>
                    </div>
                 </div>
             </div>
             </div>

             {/* Dimensional Requirements Section */}
             <div className="mt-12 space-y-8 relative z-10 pt-8 border-t border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                   <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />
                   Dimensional Requirements
                </h3>
             
             {/* Principal Building */}
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative z-10 shadow-inner">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                       <FileText className="w-4 h-4 text-slate-400" />
                       Principal Building
                    </h3>
                    <button type="button" onClick={handleAddPrincipalReq} className="text-[9px] font-black uppercase tracking-widest px-4 py-2 bg-white text-brand-ocean border border-slate-200 hover:border-brand-ocean hover:bg-brand-ocean/5 rounded-xl flex items-center gap-2 transition-all shadow-sm">
                        <Plus className="w-3 h-3" /> Add Row
                    </button>
                </div>
                
                <div className="space-y-4">
                    {principalReqs.map((req, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <input 
                                type="text" 
                                placeholder="Restriction (e.g. Min Lot Area)" 
                                value={req.key}
                                onChange={(e) => {
                                    const newReqs = [...principalReqs];
                                    newReqs[index].key = e.target.value;
                                    setPrincipalReqs(newReqs);
                                }}
                                className="input-standard flex-1 bg-white shadow-sm"
                            />
                            <input 
                                type="text" 
                                placeholder="Value (e.g. 5000 sq ft)" 
                                value={req.value}
                                onChange={(e) => {
                                    const newReqs = [...principalReqs];
                                    newReqs[index].value = e.target.value;
                                    setPrincipalReqs(newReqs);
                                }}
                                className="input-standard flex-1 bg-white shadow-sm"
                            />
                            <button type="button" onClick={() => handleRemovePrincipalReq(index)} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 bg-white border border-slate-200 rounded-xl transition-all shadow-sm">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
             </div>

             {/* Accessory Building */}
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative z-10 shadow-inner">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                       <Layers className="w-4 h-4 text-slate-400" />
                       Accessory Building
                    </h3>
                    <button type="button" onClick={handleAddAccessoryReq} className="text-[9px] font-black uppercase tracking-widest px-4 py-2 bg-white text-brand-emerald border border-slate-200 hover:border-brand-emerald hover:bg-brand-emerald/5 rounded-xl flex items-center gap-2 transition-all shadow-sm">
                        <Plus className="w-3 h-3" /> Add Row
                    </button>
                </div>
                
                <div className="space-y-4">
                    {accessoryReqs.map((req, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <input 
                                type="text" 
                                placeholder="Restriction (e.g. Max Height)" 
                                value={req.key}
                                onChange={(e) => {
                                    const newReqs = [...accessoryReqs];
                                    newReqs[index].key = e.target.value;
                                    setAccessoryReqs(newReqs);
                                }}
                                className="input-standard flex-1 bg-white shadow-sm"
                            />
                            <input 
                                type="text" 
                                placeholder="Value (e.g. 14 ft)" 
                                value={req.value}
                                onChange={(e) => {
                                    const newReqs = [...accessoryReqs];
                                    newReqs[index].value = e.target.value;
                                    setAccessoryReqs(newReqs);
                                }}
                                className="input-standard flex-1 bg-white shadow-sm"
                            />
                            <button type="button" onClick={() => handleRemoveAccessoryReq(index)} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 bg-white border border-slate-200 rounded-xl transition-all shadow-sm">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
             </div>
             </div>

             {/* Submit Area */}
             <div className="flex justify-end pt-8 mt-12 border-t border-slate-100 relative z-10">
               <button 
                  type="submit" 
                  disabled={loading || !name}
                  className="btn-primary px-10 py-3.5 shadow-premium text-xs flex items-center gap-3 disabled:opacity-50"
                >
                  {loading ? "Publishing..." : <><Save className="w-4 h-4" /> Publish Zone Data</>}
               </button>
             </div>

             <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-brand-ocean/5 blur-[100px] rounded-full -mr-40 -mt-40 pointer-events-none z-0" />
          </div>
        </form>

      </div>
    </div>
  );
}
