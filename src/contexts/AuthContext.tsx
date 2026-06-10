"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthChange, getIdToken, type User } from "@/lib/firebase";
import { isOwnerEmail } from "@/lib/tier-limits";
import type { UserTier } from "@/types/enums";

interface AuthState {
  user: User | null;
  tier: UserTier;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, tier: "FREE", loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, tier: "FREE", loading: true });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        setState({ user: null, tier: "FREE", loading: false });
        return;
      }

      // Owner always resolves to OWNER without a round-trip.
      if (isOwnerEmail(user.email)) {
        setState({ user, tier: "OWNER", loading: false });
        return;
      }

      // Resolve the real tier for everyone else; fall back to FREE on error.
      let tier: UserTier = "FREE";
      try {
        const token = await getIdToken();
        if (token) {
          const res = await fetch("/api/user/subscription", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const json = await res.json();
            if (json?.data?.tier) tier = json.data.tier as UserTier;
          }
        }
      } catch {
        /* keep FREE */
      }
      setState({ user, tier, loading: false });
    });
    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
