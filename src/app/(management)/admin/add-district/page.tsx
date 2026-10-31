"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Building2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormField } from "@/components/FormField";

const districtSchema = z.object({
  name: z.string().min(3, "District name must be at least 3 characters").max(100, "Name is too long"),
  type: z.enum(["TOWN", "VILLAGE", "CITY"], {
    errorMap: () => ({ message: "Please select a valid jurisdiction type" }),
  }),
});

type DistrictFormData = z.infer<typeof districtSchema>;

export default function AddDistrict() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<DistrictFormData>({
    resolver: zodResolver(districtSchema),
    defaultValues: {
      type: "TOWN",
    }
  });

  useState(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('admin_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.email === 'developer@ezzoning.com') {
            router.push('/admin/districts');
          }
        } catch (e) {}
      }
    }
  });

  const onSubmit = async (data: DistrictFormData) => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/districts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to add district");
      }

      router.push("/admin/districts");
      router.refresh();
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-8 relative">
      <div className="max-w-3xl mx-auto space-y-6 relative z-10 pt-6">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm relative z-10">
          <Link href="/admin/districts" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-ocean transition-all px-4 py-2 hover:bg-slate-50 rounded-xl">
            <ChevronLeft className="w-4 h-4" />
            Back to Registry
          </Link>
          <div className="px-4">
             <span className="text-[10px] font-black text-brand-slate uppercase tracking-[0.2em] italic">Provision District</span>
          </div>
        </div>

        {/* The Form */}
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-8 relative overflow-hidden">
          <div className="mb-6 relative z-10">
             <h2 className="text-2xl font-black text-brand-slate tracking-tight">Add New District</h2>
             <p className="text-sm font-medium text-slate-500 mt-1">Initialize a new town, city, or village jurisdiction boundaries.</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-sm font-bold flex items-center gap-3 relative z-10 shadow-inner">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              {error}
            </div>
          )}
          
          <form className="space-y-6 relative z-10" onSubmit={handleSubmit(onSubmit)}>
            
            <FormField
              label="District Name"
              placeholder="e.g., Town of Huntington"
              icon={<MapPin />}
              registration={register("name")}
              error={errors.name?.message}
            />

            <div className="space-y-3">
              <label htmlFor="type" className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-emerald" />
                Jurisdiction Type
              </label>
              <div className="relative">
                <select
                  {...register("type")}
                  className={`input-standard pl-4 pr-10 bg-slate-50/50 border-slate-200 text-slate-700 font-bold appearance-none w-full shadow-sm hover:border-brand-ocean/30 transition-colors cursor-pointer ${errors.type ? "border-rose-500 focus:ring-rose-500" : ""}`}
                >
                  <option value="TOWN">Town</option>
                  <option value="VILLAGE">Village</option>
                  <option value="CITY">City</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                   <ChevronLeft className="w-4 h-4 text-slate-400 -rotate-90" />
                </div>
              </div>
              {errors.type && <p className="form-error">{errors.type.message}</p>}
            </div>

            <div className="pt-8 border-t border-slate-100 flex justify-end gap-4 mt-10">
              <Link href="/admin/districts" className="btn-outline px-8 py-3.5 shadow-sm text-xs border-slate-200 hover:border-slate-300">
                Cancel
              </Link>
              <button 
                type="submit" 
                disabled={loading || !isValid}
                className="btn-primary px-10 py-3.5 shadow-premium text-xs flex items-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create District"
                )}
              </button>
            </div>
          </form>

          <div className="absolute right-0 top-0 w-96 h-96 bg-brand-ocean/5 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
        </div>

      </div>
    </div>
  );
}
