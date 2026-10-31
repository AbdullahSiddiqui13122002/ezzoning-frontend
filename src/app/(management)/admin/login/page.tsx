"use client";

import { useState } from "react";
import { Lock, Mail, Loader2, Crown, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormField } from "@/components/FormField";

const adminLoginSchema = z.object({
  email: z.string().email("Please enter a valid admin email"),
  password: z.string().min(1, "Security key is required"),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Login failed");
      }

      if (result.user.role !== "ADMIN") {
        throw new Error("Access denied. Admin role required.");
      }

      // Store token in localStorage
      localStorage.setItem("admin_token", result.token);
      localStorage.setItem("admin_user", JSON.stringify(result.user));

      if (result.user.email === 'developer@ezzoning.com') {
        router.push("/admin/districts");
      } else {
        router.push("/admin");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-ocean/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="ezZoning Logo" className="h-16 w-auto" />
          </div>

          <div className="text-center mb-10">
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase italic mt-4">
              <span className="text-brand-ocean">Admin</span> Access
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Command Center Security Protocol</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-sm font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              label="Admin Email"
              type="email"
              placeholder="admin@ezzoning.com"
              variant="standard"
              icon={<Mail />}
              registration={register("email")}
              error={errors.email?.message}
            />

            <div className="relative w-full">
              <FormField
                label="Security Key"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                variant="standard"
                icon={<Lock />}
                registration={register("password")}
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[44px] text-slate-400 hover:text-brand-ocean transition-colors z-20"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 group uppercase tracking-widest py-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Access Terminal
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center border-t border-slate-100 pt-8">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Authorized Personnel Only</p>
          </div>
        </div>
      </div>
    </div>
  );
}
