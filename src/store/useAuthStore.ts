import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  dbPlanTier: string;
  planUpdatedAt: string | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  dbPlanTier: "FREE",
  planUpdatedAt: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  
  initialize: async () => {
    // Get initial session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
    }
    
    let dbPlanTier = "FREE";
    let planUpdatedAt = null;
    if (session?.user?.email) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me?email=${encodeURIComponent(session.user.email)}`);
        const data = await res.json();
        if (data.planTier) dbPlanTier = data.planTier;
        if (data.updatedAt) planUpdatedAt = data.updatedAt;
      } catch (e) {
        console.error("Failed to fetch custom user data:", e);
      }
    }

    set({ 
      session, 
      user: session?.user || null,
      dbPlanTier,
      planUpdatedAt,
      loading: false 
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      let currentPlanTier = "FREE";
      let currentPlanUpdatedAt = null;
      if (session?.user?.email) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me?email=${encodeURIComponent(session.user.email)}`);
          const data = await res.json();
          if (data.planTier) currentPlanTier = data.planTier;
          if (data.updatedAt) currentPlanUpdatedAt = data.updatedAt;
        } catch (e) {
           console.error("Failed to fetch custom user data on auth change:", e);
        }
      }

      set({ 
        session, 
        user: session?.user || null,
        dbPlanTier: currentPlanTier,
        planUpdatedAt: currentPlanUpdatedAt
      });
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  }
}));
