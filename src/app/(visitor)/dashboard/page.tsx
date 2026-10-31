"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useMapStore } from "@/store/useMapStore";
import { ArrowLeft, Crown, CreditCard, Clock, Settings, MapPin, ExternalLink, ShieldCheck, TrendingUp, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SearchHistoryItem {
  id: string;
  address: string;
  zone: string;
  createdAt: string;
}

export default function UserDashboard() {
  const { user, loading, dbPlanTier, planUpdatedAt } = useAuthStore();
  const setPendingSearchAddress = useMapStore((state) => state.setPendingSearchAddress);
  const router = useRouter();

  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [resetEmailLoading, setResetEmailLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showDirectChange, setShowDirectChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [directChangeLoading, setDirectChangeLoading] = useState(false);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.email) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/history?email=${encodeURIComponent(user.email)}`)
        .then((res) => res.json())
        .then((data) => {
          setHistory(data.history || []);
          setHistoryLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch history:", err);
          setHistoryLoading(false);
        });
    }
  }, [user]);

  const handleManageBilling = async () => {
    if (!user) return;
    setIsPortalLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stripe/create-portal-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create portal session");
      }

      const { url } = await response.json();
      window.location.href = url; // Redirect to Stripe Portal
    } catch (error: any) {
      console.error("Portal Error:", error);
      alert(error.message || "Could not access billing portal. Please contact support.");
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    setResetEmailLoading(true);
    setResetMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setResetMessage({
        type: "success",
        text: `Password reset link sent to ${user.email}. Please check your inbox (and spam folder) to set a new password.`,
      });
    } catch (err: any) {
      setResetMessage({
        type: "error",
        text: err.message || "Failed to send reset email. Please try again.",
      });
    } finally {
      setResetEmailLoading(false);
    }
  };

  const handleDirectPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setResetMessage({
        type: "error",
        text: "Password must be at least 8 characters long.",
      });
      return;
    }
    setDirectChangeLoading(true);
    setResetMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setResetMessage({
        type: "success",
        text: "Your password has been updated successfully!",
      });
      setNewPassword("");
      setShowDirectChange(false);
    } catch (err: any) {
      setResetMessage({
        type: "error",
        text: err.message || "Failed to update password. Please try again.",
      });
    } finally {
      setDirectChangeLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-brand-ocean border-t-transparent animate-spin" />
      </div>
    );
  }

  const planTier = dbPlanTier || "FREE";
  
  // Calculate usage visual logic
  const isFree = planTier === "FREE";
  
  // Only count searches that occurred after the current plan was activated
  const validSearches = planUpdatedAt 
    ? history.filter(h => new Date(h.createdAt).getTime() >= new Date(planUpdatedAt).getTime())
    : history;
    
  const searchesUsed = historyLoading ? 0 : validSearches.length;
  const freeLimit = process.env.NEXT_PUBLIC_FREE_SEARCH_LIMIT !== undefined 
    ? Number(process.env.NEXT_PUBLIC_FREE_SEARCH_LIMIT) 
    : 1;
  const searchLimit = isFree 
    ? freeLimit 
    : (planTier === "PAYG" 
        ? 1 
        : (planTier === "BASIC" ? 5 : "Unlimited")
      );
  const isLimitReached = typeof searchLimit === 'number' && searchesUsed >= searchLimit;
  
  let usagePercentage = 0;
  if (isFree) {
    usagePercentage = freeLimit > 0 ? (searchesUsed / freeLimit) * 100 : 100;
  } else if (planTier === "BASIC") {
    usagePercentage = (searchesUsed / 5) * 100;
  } else {
    usagePercentage = 25; // visual fake for unlimited so the bar isn't completely empty
  }

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(history.length / ITEMS_PER_PAGE));
  const currentHistory = history.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-brand-ocean/20 selection:text-brand-slate flex flex-col">
      {/* Navigation */}
      <header className="h-16 md:h-20 bg-white/80 backdrop-blur-2xl border-b border-slate-100 flex items-center justify-between px-4 md:px-8 shrink-0 z-30 transition-all gap-2">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/" className="bg-brand-ocean/10 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-sm border border-brand-ocean/20 hover:bg-brand-ocean/20 transition-all cursor-pointer shrink-0">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-brand-ocean" />
          </Link>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="ezZoning Logo" className="h-8 md:h-10 w-auto" />
            <span className="hidden md:inline text-sm md:text-xl font-black tracking-tighter text-brand-slate uppercase italic whitespace-nowrap">Dashboard</span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <div className="hidden md:flex flex-col text-right justify-center">
                <span className="text-sm font-black text-brand-slate tracking-tight mb-1 truncate max-w-[120px] lg:max-w-xs">{user.email?.split('@')[0]}</span>
                <div className="flex justify-end">
                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                    planTier === 'UNLIMITED' ? 'bg-amber-100 text-amber-700 border-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.2)]' :
                    planTier === 'BASIC' ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20' :
                    planTier === 'PAYG' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                    'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                    {planTier} PLAN
                </span>
                </div>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-brand-ocean/10 flex items-center justify-center border border-brand-ocean/20 shadow-sm">
                <Crown className="w-5 h-5 text-brand-ocean" />
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-8 lg:p-12 relative">
        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Column: History & Data */}
            <div className="flex-1 space-y-8">
                
                {/* Header Section */}
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Welcome Back.</h2>
                    <p className="text-slate-500 font-medium text-sm">Manage your account, review past zoning research, and upgrade your subscription.</p>
                </div>

                {/* History Card */}
                <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-premium relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-ocean/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                        <div className="p-2.5 bg-brand-ocean/10 rounded-xl">
                            <Clock className="w-5 h-5 text-brand-ocean" />
                        </div>
                        <h3 className="text-lg font-black text-brand-slate uppercase tracking-tight">Recent Property Searches</h3>
                    </div>

                    <div className="overflow-x-auto relative z-10">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Property Address</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Zoning Code</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date Searched</th>
                                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {historyLoading ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-slate-400 text-xs font-bold animate-pulse">Loading search history...</td>
                                    </tr>
                                ) : history.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-slate-400 text-xs font-bold">No property searches yet.</td>
                                    </tr>
                                ) : (
                                    currentHistory.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-5 pr-4 flex items-center gap-3">
                                                <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-200">
                                                    <MapPin className="w-4 h-4 text-slate-400 group-hover:text-brand-ocean transition-colors" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 tracking-tight">{item.address.split(',')[0]}</span>
                                            </td>
                                            <td className="py-5 pr-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                                    item.zone.includes('COMMERCIAL') ? 'bg-brand-ocean/10 text-brand-ocean' :
                                                    item.zone.includes('RESIDENTIAL') ? 'bg-brand-emerald/10 text-brand-emerald' :
                                                    item.zone === 'No Data Available' ? 'bg-slate-100 text-slate-500' :
                                                    'bg-brand-purple/10 text-brand-purple'
                                                }`}>
                                                    {item.zone}
                                                </span>
                                            </td>
                                            <td className="py-5 pr-4 text-xs font-bold text-slate-400">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-5 text-right">
                                                <button 
                                                    onClick={() => {
                                                        setPendingSearchAddress(item.address);
                                                        router.push('/');
                                                    }}
                                                    disabled={isLimitReached}
                                                    title={isLimitReached ? "Search limit reached" : ""}
                                                    className="cursor-pointer text-brand-ocean font-bold text-xs uppercase tracking-widest hover:text-cyan-500 transition-colors flex items-center gap-1 justify-end w-full disabled:opacity-50 disabled:hover:text-brand-ocean disabled:cursor-not-allowed"
                                                >
                                                    View Map <ExternalLink className="w-3 h-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {!historyLoading && history.length > ITEMS_PER_PAGE && (
                        <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-2 relative z-10">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-ocean disabled:opacity-30 disabled:hover:text-slate-500 transition-colors flex items-center gap-1"
                            >
                                <ArrowLeft className="w-3 h-3" /> Previous
                            </button>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-md">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-ocean disabled:opacity-30 disabled:hover:text-slate-500 transition-colors flex items-center gap-1"
                            >
                                Next <ArrowLeft className="w-3 h-3 rotate-180" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Billing & Account */}
            <div className="w-full lg:w-96 space-y-8">
                
                {/* Usage & Billing Card */}
                <div className="rounded-[2rem] p-8 border shadow-premium relative overflow-hidden group bg-white border-brand-ocean/20">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-full h-full rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-all duration-700 bg-brand-ocean/5 group-hover:bg-brand-ocean/10" />

                    <div className="relative z-10 flex items-center justify-between mb-6">
                        <div className="p-2.5 rounded-xl bg-brand-ocean/10">
                            <CreditCard className="w-5 h-5 text-brand-ocean" />
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-brand-ocean/10 text-brand-ocean">
                            Usage & Billing
                        </span>
                    </div>

                    <div className="relative z-10 space-y-4 mb-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-slate-500">Current Plan</p>
                            <h4 className="text-2xl font-black tracking-tight text-slate-900">{planTier} TIER</h4>
                        </div>
                        
                        <div className="space-y-2 pt-4">
                            <div className="flex justify-between items-end">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Property Searches</p>
                                {historyLoading ? (
                                    <div className="h-4 w-12 bg-slate-100 rounded animate-pulse" />
                                ) : (
                                    <p className="text-xs font-black text-slate-900">{searchesUsed} / {searchLimit}</p>
                                )}
                            </div>
                            <div className="w-full h-2 rounded-full overflow-hidden bg-slate-100 relative">
                                {historyLoading ? (
                                    <div className="absolute inset-0 bg-slate-200 animate-pulse" />
                                ) : (
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${isFree && usagePercentage >= 100 ? 'bg-rose-500' : 'bg-brand-ocean'}`}
                                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                    />
                                )}
                            </div>
                            {!historyLoading && isFree && usagePercentage >= 100 && (
                                <p className="text-[10px] font-bold text-rose-500 mt-2 animate-in fade-in duration-500">Search limit reached. Upgrade to continue.</p>
                            )}
                        </div>
                    </div>

                    {isFree ? (
                        <Link href="/pricing" className="w-full py-4 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all relative z-10 bg-brand-ocean hover:bg-cyan-400 text-white shadow-lg shadow-brand-ocean/20">
                            Upgrade to Pro <TrendingUp className="w-4 h-4" />
                        </Link>
                    ) : (
                        <div className="space-y-3 relative z-10">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center leading-relaxed">
                                Cancel or update your subscription details anytime via the Stripe Billing Portal.
                            </p>
                            <button 
                                onClick={handleManageBilling}
                                disabled={isPortalLoading}
                                className="w-full py-4 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all bg-white border border-slate-200 text-slate-600 hover:border-brand-ocean hover:text-brand-ocean hover:bg-slate-50 shadow-sm disabled:opacity-50"
                            >
                                {isPortalLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading Portal...
                                    </>
                                ) : (
                                    <>
                                        Manage Subscription <Settings className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Account Security Card */}
                <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-premium">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-slate-100 rounded-xl">
                            <ShieldCheck className="w-5 h-5 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-black text-brand-slate uppercase tracking-tight">Account Security</h3>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Registered Email</p>
                            <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 truncate">
                                {user.email}
                            </div>
                        </div>
                        {resetMessage && (
                            <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
                                resetMessage.type === "success" 
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                                    : "bg-rose-50 border-rose-200 text-rose-700"
                            }`}>
                                {resetMessage.type === "success" ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                )}
                                <p className="text-xs font-bold leading-relaxed">{resetMessage.text}</p>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDirectChange(!showDirectChange);
                                        setResetMessage(null);
                                    }}
                                    className="text-[10px] font-bold text-brand-ocean hover:underline uppercase tracking-wider cursor-pointer"
                                >
                                    {showDirectChange ? "Cancel" : "Change Directly"}
                                </button>
                            </div>

                            {showDirectChange ? (
                                <form onSubmit={handleDirectPasswordChange} className="space-y-3 mt-2 animate-in fade-in duration-200">
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password (min. 8 chars)"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-ocean focus:ring-1 focus:ring-brand-ocean pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-3 text-slate-400 hover:text-brand-ocean cursor-pointer"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={directChangeLoading || !newPassword}
                                        className="px-4 py-3 w-full bg-brand-ocean text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-cyan-500 transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-ocean/20 disabled:opacity-50 cursor-pointer"
                                    >
                                        {directChangeLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            "Save New Password"
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSendResetEmail}
                                    disabled={resetEmailLoading}
                                    className="px-4 py-3 w-full bg-white rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-brand-ocean hover:bg-slate-50 hover:border-brand-ocean/30 transition-all flex items-center justify-center gap-2 text-center disabled:opacity-50 cursor-pointer shadow-sm"
                                >
                                    {resetEmailLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin text-brand-ocean" />
                                            Sending Reset Link...
                                        </>
                                    ) : resetMessage?.type === "success" ? (
                                        "Resend Reset Email"
                                    ) : (
                                        "Reset Password"
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </main>
    </div>
  );
}
