"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Lock, Loader2, Crown, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormField } from "@/components/FormField";

const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type UpdatePasswordData = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Supabase automatically extracts the access_token from the URL hash 
  // and establishes a session when the user clicks the email link.
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (!session && !hash.includes("access_token")) {
        setError("No active password reset session found. Please request a new link from your dashboard or login page.");
      }
    };
    checkSession();
  }, []);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordData>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = async (data: UpdatePasswordData) => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) throw updateError;
      
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2500);
      
    } catch (err: any) {
      setError(err.message || "Failed to update password. Your link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-brand-ocean/10 selection:text-brand-ocean flex flex-col">
      
      {/* Navigation */}
      <nav className="w-full px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-brand-ocean transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-bold tracking-widest uppercase">Back to Platform</span>
        </Link>
        <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-brand-ocean" />
            <span className="text-xl font-black tracking-tighter uppercase italic text-slate-900">ezZoning <span className="text-brand-ocean">Atlas</span></span>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-ocean/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Auth Card */}
        <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-ocean/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
                  Set New Password
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  Please enter a new, secure password for your account.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-sm font-bold text-center">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 text-sm font-bold text-center">
                    Password updated successfully! Redirecting...
                </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="relative w-full">
                    <FormField
                      label="New Password"
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
                      className="btn-primary w-full mt-4 flex items-center justify-center gap-3 relative overflow-hidden group uppercase tracking-widest"
                  >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                      {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                          "Update Password"
                      )}
                  </button>
              </form>
            )}

        </div>
      </main>
    </div>
  );
}
