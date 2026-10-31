"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Save, Plus, Trash2, Link as LinkIcon, FileText, UploadCloud, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormField } from "@/components/FormField";

const zoneSchema = z.object({
  name: z.string().min(2, "Zone name must be at least 2 characters").max(100, "Name is too long"),
  classification: z.enum(["RESIDENTIAL", "COMMERCIAL", "MIXED", "INDUSTRIAL"]),
  ecodeLink: z.string().url("Please enter a valid Ecode360 URL").or(z.literal("")),
  principalRequirements: z.array(z.object({
    key: z.string().min(1, "Restriction name is required"),
    value: z.string().min(1, "Value is required"),
  })),
  accessoryRequirements: z.array(z.object({
    key: z.string().min(1, "Restriction name is required"),
    value: z.string().min(1, "Value is required"),
  })),
});

type ZoneFormData = z.infer<typeof zoneSchema>;

export default function AddZone() {
  const router = useRouter();
  const params = useParams();
  const districtId = params.id;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ordinanceFile, setOrdinanceFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ZoneFormData>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      classification: "RESIDENTIAL",
      principalRequirements: [
        { key: "Minimum Lot Area", value: "" },
        { key: "Front Yard Setback", value: "" },
      ],
      accessoryRequirements: [
        { key: "Maximum Building Height", value: "" },
      ],
    }
  });

  const { fields: principalFields, append: appendPrincipal, remove: removePrincipal } = useFieldArray({
    control,
    name: "principalRequirements",
  });

  const { fields: accessoryFields, append: appendAccessory, remove: removeAccessory } = useFieldArray({
    control,
    name: "accessoryRequirements",
  });

  const onSubmit = async (data: ZoneFormData) => {
    setLoading(true);
    setError("");

    try {
      let finalOrdinanceUrl = "";

      // 1. If a file was selected, upload it to Supabase Storage first
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

      // 2. Transform Arrays into Objects for JSON storage
      const principalJson: Record<string, string> = {};
      data.principalRequirements.forEach(req => { principalJson[req.key] = req.value; });
      
      const accessoryJson: Record<string, string> = {};
      data.accessoryRequirements.forEach(req => { accessoryJson[req.key] = req.value; });

      setUploadProgress(90);

      // 3. Save to PostgreSQL Database
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/zones`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          districtId, 
          name: data.name, 
          classification: data.classification,
          ecodeLink: data.ecodeLink,
          ordinanceUrl: finalOrdinanceUrl || null,
          principalRequirements: principalJson,
          accessoryRequirements: accessoryJson
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
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/districts" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-brand-slate tracking-tight">Add Zone Requirements</h1>
            <p className="text-slate-500 mt-1 font-medium">Configure property settings and constraints for this zoning district.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {/* Core Configuration Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-8 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-ocean"></div>

             <h2 className="text-lg font-black text-brand-slate uppercase tracking-wider border-b border-slate-100 pb-3">Core Designation</h2>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <FormField
                    label="Zone Name Identifier"
                    placeholder="e.g., Residence District (R-5)"
                    registration={register("name")}
                    error={errors.name?.message}
                 />
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Classification Category</label>
                    <select
                        {...register("classification")}
                        className={`input-standard ${errors.classification ? "border-rose-500 focus:ring-rose-500" : ""}`}
                    >
                        <option value="RESIDENTIAL">Residential</option>
                        <option value="COMMERCIAL">Commercial</option>
                        <option value="MIXED">Mixed-use</option>
                        <option value="INDUSTRIAL">Industrial</option>
                    </select>
                    {errors.classification && <p className="form-error">{errors.classification.message}</p>}
                 </div>
                 
                 <div className="md:col-span-2">
                    <FormField
                        label="Ecode360 URL Link"
                        placeholder="https://ecode360.com/..."
                        icon={<LinkIcon className="text-emerald-600" />}
                        registration={register("ecodeLink")}
                        error={errors.ecodeLink?.message}
                    />
                 </div>

                 <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                        <UploadCloud className="w-4 h-4 text-brand-purple" />
                        PDF Ordinance Upload
                    </label>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 hover:border-brand-ocean transition-all group">
                        <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                setOrdinanceFile(e.target.files[0]);
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-brand-ocean transition-colors">
                           <FileText className="w-8 h-8" />
                           <span className="text-sm font-bold">{ordinanceFile ? ordinanceFile.name : "Click or drag to upload zone ordinance PDF"}</span>
                           {ordinanceFile && <span className="text-[10px] font-medium uppercase text-slate-500">{(ordinanceFile.size / 1024 / 1024).toFixed(2)} MB</span>}
                        </div>
                        
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="w-full max-w-xs mt-6 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-brand-ocean h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                        )}
                    </div>
                 </div>
             </div>
          </div>

          {/* Dimensional Requirements Tables */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-10">
             <h2 className="text-lg font-black text-brand-slate uppercase tracking-wider border-b border-slate-100 pb-3">Dimensional Requirements</h2>
             
             {/* Principal Building */}
             <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-brand-ocean rounded-full"></div>
                        <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.2em]">Principal Building</h3>
                    </div>
                    <button type="button" onClick={() => appendPrincipal({ key: "", value: "" })} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-brand-ocean/10 text-brand-ocean hover:bg-brand-ocean/20 rounded-xl flex items-center gap-2 transition-all">
                        <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                </div>
                
                <div className="space-y-4">
                    {principalFields.map((field, index) => (
                        <div key={field.id} className="flex items-start gap-4 group animate-in slide-in-from-left-2 duration-200">
                            <div className="flex-1">
                                <input 
                                    {...register(`principalRequirements.${index}.key` as const)}
                                    placeholder="Restriction (e.g. Min Lot Area)" 
                                    className={`input-standard text-sm ${errors.principalRequirements?.[index]?.key ? "border-rose-500" : ""}`}
                                />
                                {errors.principalRequirements?.[index]?.key && <p className="form-error">{errors.principalRequirements?.[index]?.key?.message}</p>}
                            </div>
                            <div className="flex-1">
                                <input 
                                    {...register(`principalRequirements.${index}.value` as const)}
                                    placeholder="Value (e.g. 5000 sq ft)" 
                                    className={`input-standard text-sm ${errors.principalRequirements?.[index]?.value ? "border-rose-500" : ""}`}
                                />
                                {errors.principalRequirements?.[index]?.value && <p className="form-error">{errors.principalRequirements?.[index]?.value?.message}</p>}
                            </div>
                            <button type="button" onClick={() => removePrincipal(index)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
             </div>

             {/* Accessory Building */}
             <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-brand-emerald rounded-full"></div>
                        <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.2em]">Accessory Building</h3>
                    </div>
                    <button type="button" onClick={() => appendAccessory({ key: "", value: "" })} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-brand-emerald/10 text-brand-emerald hover:bg-brand-emerald/20 rounded-xl flex items-center gap-2 transition-all">
                        <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                </div>
                
                <div className="space-y-4">
                    {accessoryFields.map((field, index) => (
                        <div key={field.id} className="flex items-start gap-4 group animate-in slide-in-from-left-2 duration-200">
                            <div className="flex-1">
                                <input 
                                    {...register(`accessoryRequirements.${index}.key` as const)}
                                    placeholder="Restriction (e.g. Max Height)" 
                                    className={`input-standard text-sm ${errors.accessoryRequirements?.[index]?.key ? "border-rose-500" : ""}`}
                                />
                                {errors.accessoryRequirements?.[index]?.key && <p className="form-error">{errors.accessoryRequirements?.[index]?.key?.message}</p>}
                            </div>
                            <div className="flex-1">
                                <input 
                                    {...register(`accessoryRequirements.${index}.value` as const)}
                                    placeholder="Value (e.g. 14 ft)" 
                                    className={`input-standard text-sm ${errors.accessoryRequirements?.[index]?.value ? "border-rose-500" : ""}`}
                                />
                                {errors.accessoryRequirements?.[index]?.value && <p className="form-error">{errors.accessoryRequirements?.[index]?.value?.message}</p>}
                            </div>
                            <button type="button" onClick={() => removeAccessory(index)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
             </div>
          </div>

          <div className="flex justify-end pt-4 pb-20">
             <button 
                type="submit" 
                disabled={loading || !isValid}
                className="btn-secondary px-8 py-4 flex items-center gap-3"
              >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving Records...
                    </>
                ) : (
                    <>
                        <Save className="w-5 h-5" /> 
                        Publish Zone Data
                    </>
                )}
             </button>
          </div>
        </form>

      </div>
    </div>
  );
}
