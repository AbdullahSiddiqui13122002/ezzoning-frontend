"use client";

import { useState, useEffect, Suspense } from "react";
import { ArrowLeft, CheckCircle2, Zap, Shield, Crown, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

function PricingContent() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const sessionId = searchParams.get("session_id");

    if (success) {
      if (sessionId) {
        setMessage({ text: "Payment received! Verifying and activating your subscription...", type: "success" });
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/stripe/verify-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
          .then((res) => res.json())
          .then(async (data) => {
            const { initialize } = useAuthStore.getState();
            await initialize();
            if (data.success) {
              setMessage({
                text: `Payment successful! Your ${data.planTier || "Pro"} plan is now active.`,
                type: "success",
              });
            } else {
              setMessage({ text: "Payment successful! Welcome to ezZoning Pro.", type: "success" });
            }
          })
          .catch(async (err) => {
            console.error("Verification error:", err);
            const { initialize } = useAuthStore.getState();
            await initialize();
            setMessage({ text: "Payment successful! Welcome to ezZoning Pro.", type: "success" });
          });
      } else {
        setMessage({ text: "Payment successful! Welcome to ezZoning Pro.", type: "success" });
        const { initialize } = useAuthStore.getState();
        initialize();
      }
    }
    if (canceled) {
      setMessage({ text: "Checkout canceled. You can try again whenever you're ready.", type: "error" });
    }
  }, [searchParams]);

  const handleCheckout = async (planId: string) => {
    if (planId === "free") {
      router.push("/");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stripe/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userId: user?.id || "temp_unauthenticated_user", 
          email: user?.email || "",
          planId: planId 
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned from server.");
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      setMessage({ text: "Failed to initiate checkout. Please ensure your backend is running and keys are set.", type: "error" });
      setLoading(false);
    }
  };

  const freeLimit = process.env.NEXT_PUBLIC_FREE_SEARCH_LIMIT !== undefined 
    ? Number(process.env.NEXT_PUBLIC_FREE_SEARCH_LIMIT) 
    : 1;

  const plans = [
    ...(freeLimit > 0 ? [{
      id: "free",
      name: freeLimit === 1 ? "One Free Search" : `${freeLimit} Free Searches`,
      price: "0",
      description: "Get started for free.",
      features: [
        `${freeLimit} complimentary search${freeLimit > 1 ? "es" : ""}`,
        "Required information input",
        "Standard map features"
      ],
      buttonText: "Start Searching",
      highlight: false
    }] : []),
    {
      id: "pay-as-you-go",
      name: "Pay-As-You-Go",
      price: "6",
      period: "/search",
      description: "No subscription required.",
      features: ["$6 per individual search", "Full property insights", "Access to E-Code library"],
      buttonText: "Buy Search Credits",
      highlight: false
    },
    {
      id: "basic",
      name: "Basic Plan",
      price: "20",
      period: "/month",
      description: "For small scale use.",
      features: ["5 searches per month", "Priority data processing", "Full property insights"],
      buttonText: "Choose Basic",
      highlight: true
    },
    {
      id: "unlimited",
      name: "Unlimited Plan",
      price: "49",
      period: "/month",
      description: "For power users.",
      features: ["Unlimited searches", "Full platform access", "Priority support"],
      buttonText: "Go Unlimited",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-brand-ocean/10 selection:text-brand-ocean pb-24">
      
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-brand-ocean transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-bold tracking-widest uppercase">Back to Platform</span>
        </Link>
        <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-brand-ocean" />
            <span className="text-xl font-black tracking-tighter uppercase italic text-slate-900">ezZoning <span className="text-brand-ocean">Plans</span></span>
        </div>
      </nav>

      <main className="relative pt-32 px-6 flex flex-col items-center">
        
        {/* Background Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full h-full bg-brand-ocean/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Message Banner */}
        {message && (
          <div className={`mb-8 p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 max-w-md w-full justify-center ${
            message.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-rose-500/10 border-rose-500/20 text-rose-600"
          }`}>
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
            <p className="text-sm font-bold">{message.text}</p>
          </div>
        )}

        <div className="text-center space-y-6 max-w-3xl relative z-10 mb-16">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic text-slate-900">
            Transparent <span className="text-brand-ocean italic">Pricing</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto uppercase tracking-widest">
            Choose the plan that fits your professional needs.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl relative z-10">
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`relative bg-white border border-slate-200 rounded-[2.5rem] p-8 flex flex-col hover:border-brand-ocean/30 transition-all duration-500 group shadow-xl hover:shadow-2xl hover:shadow-slate-200/50 ${plan.highlight ? 'ring-2 ring-brand-ocean bg-slate-50/50' : ''}`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-ocean text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest">
                  Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4">{plan.name}</h3>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-brand-ocean tracking-tighter">${plan.price}</span>
                  {plan.period && <span className="text-slate-400 text-sm font-bold mb-1 uppercase tracking-widest">{plan.period}</span>}
                </div>
                <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">{plan.description}</p>
              </div>

              <div className="space-y-4 flex-grow mb-10">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-brand-ocean shrink-0 mt-0.5" />
                    <span className="text-slate-600 text-xs font-bold leading-tight uppercase tracking-tight">{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handleCheckout(plan.id)}
                disabled={loading}
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 relative overflow-hidden group uppercase tracking-widest text-xs font-black transition-all ${plan.highlight ? 'bg-brand-ocean text-white' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Privacy & Legal Section */}
        <section className="mt-32 w-full max-w-4xl relative z-10 border-t border-slate-100 pt-16">
          <div className="text-center mb-12">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 text-brand-ocean text-[10px] font-black tracking-[0.2em] uppercase mb-4">
                <Shield className="w-4 h-4" />
                Security & Compliance
             </div>
             <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Data Privacy & <span className="text-brand-ocean">Legal Notes</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
               <h4 className="text-brand-ocean text-xs font-black uppercase tracking-widest mb-4">User Information</h4>
               <p className="text-slate-600 text-sm font-medium leading-relaxed">Property details and contact information may be required to process specific zoning searches and provide accurate reports.</p>
            </div>
            <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
               <h4 className="text-brand-ocean text-xs font-black uppercase tracking-widest mb-4">Data Usage</h4>
               <p className="text-slate-600 text-sm font-medium leading-relaxed">Your data is used strictly for search results, platform improvements, and critical communication. We never sell your information to third parties.</p>
            </div>
            <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
               <h4 className="text-brand-ocean text-xs font-black uppercase tracking-widest mb-4">Security</h4>
               <p className="text-slate-600 text-sm font-medium leading-relaxed">Platform security is our priority. All transactions and user data are protected with secure bank-grade encryption and restricted access controls.</p>
            </div>
            <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 ring-1 ring-brand-ocean/5">
               <h4 className="text-brand-ocean text-xs font-black uppercase tracking-widest mb-4">Disclaimer</h4>
               <p className="text-slate-600 text-sm font-medium leading-relaxed italic">Information provided is for reference only and must be verified with local municipal authorities. This tool does not constitute legal or professional architectural advice.</p>
            </div>
          </div>

          <div className="mt-16 text-center">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">ezZoning Visualization Platform © 2024</p>
          </div>
        </section>

      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-brand-ocean" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
