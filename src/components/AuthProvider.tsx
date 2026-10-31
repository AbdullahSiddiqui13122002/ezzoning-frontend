"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initialize();

    // 1. Check URL hash or search params immediately for password recovery
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const search = window.location.search;
      if (
        (hash.includes("type=recovery") || search.includes("type=recovery")) &&
        pathname !== "/auth/update-password"
      ) {
        router.push(`/auth/update-password${hash || search}`);
      }
    }

    // 2. Listen for Supabase PASSWORD_RECOVERY auth event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        if (pathname !== "/auth/update-password") {
          const currentHash = typeof window !== "undefined" ? window.location.hash : "";
          router.push(`/auth/update-password${currentHash}`);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialize, router, pathname]);

  return <>{children}</>;
}
