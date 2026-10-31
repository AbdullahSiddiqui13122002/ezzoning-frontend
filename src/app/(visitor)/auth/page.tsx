"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Mail, Lock, Loader2, Crown, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormField } from "@/components/FormField";
import { useAuthStore } from "@/store/useAuthStore";

const authSchema = z.object({
  email: z.string().email("Please enter a valid business email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const user = useAuthStore((state) => state.user);

  // Check for email confirmation or password recovery hash on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("type=recovery")) {
        router.push(`/auth/update-password${hash}`);
        return;
      }
      if (hash.includes("type=signup") && hash.includes("access_token")) {
        setSuccessMessage("Email confirmed successfully! Logging you in and redirecting to the platform...");
      }
    }
  }, [router]);

  // Automatically redirect back to platform if user is logged in
  useEffect(() => {
    if (user) {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash.includes("type=recovery")) {
        router.push(`/auth/update-password${hash}`);
        return;
      }
      if (hash.includes("type=signup")) {
        setSuccessMessage("Email confirmed successfully! Logging you in and redirecting to the platform...");
        const timer = setTimeout(() => {
          router.push("/");
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        router.push("/");
      }
    }
  }, [user, router]);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthFormData) => {
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (authError) throw authError;
        router.push("/");
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
          }
        });
        if (authError) throw authError;
        alert("Registration successful! Please check your inbox and confirm your email link to activate your account.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = getValues("email");
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address first.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (authError) throw authError;
      alert("Password reset email sent! Please check your inbox.");
      setIsForgotPassword(false);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
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
            <img src="/logo.png" alt="ezZoning Logo" className="h-12 w-auto" />
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
                  {isForgotPassword ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  {isForgotPassword ? "Enter your email to receive a reset link." : isLogin ? "Log in to access your zoning projects." : "Join the ultimate zoning intelligence platform."}
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-sm font-bold text-center">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 text-sm font-bold text-center flex flex-col items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    <span>{successMessage}</span>
                </div>
            )}

            {!isForgotPassword ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    label="Email Address"
                    type="email"
                    placeholder="architect@firm.com"
                    variant="standard"
                    icon={<Mail />}
                    registration={register("email")}
                    error={errors.email?.message}
                  />

                  <div className="relative w-full">
                    <FormField
                      label="Password"
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
                    
                    {isLogin && (
                      <div className="flex justify-end mt-2">
                          <button 
                            type="button" 
                            onClick={() => setIsForgotPassword(true)} 
                            className="text-[10px] font-black text-slate-400 hover:text-brand-ocean transition-colors uppercase tracking-widest"
                          >
                              Forgot Password?
                          </button>
                      </div>
                    )}
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
                          isLogin ? "Sign In" : "Create Account"
                      )}
                  </button>
              </form>
            ) : (
              <div className="space-y-5">
                  <FormField
                    label="Email Address"
                    type="email"
                    placeholder="architect@firm.com"
                    variant="standard"
                    icon={<Mail />}
                    registration={register("email")}
                    error={errors.email?.message}
                  />
                  <button 
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className="btn-primary w-full mt-4 flex items-center justify-center gap-3 relative overflow-hidden group uppercase tracking-widest"
                  >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
                  </button>
              </div>
            )}

            <div className="mt-8 text-center border-t border-slate-100 pt-8">
                <button 
                    onClick={() => {
                        if (isForgotPassword) {
                           setIsForgotPassword(false);
                        } else {
                           setIsLogin(!isLogin);
                        }
                        setError(null);
                    }}
                    className="w-full py-4 bg-brand-ocean/10 text-brand-ocean hover:bg-brand-ocean hover:text-white transition-all duration-300 rounded-2xl text-xs font-black uppercase tracking-widest cursor-pointer"
                >
                    {isForgotPassword ? "Back to Login" : isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                </button>
            </div>
        </div>
      </main>
    </div>
  );
}
