"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { createProgressRpcAdapter } from "@/lib/progress-rpc";
import {
  createProgressSyncCoordinator,
  type ProgressSyncCoordinator,
  type ProgressSyncSnapshot,
} from "@/lib/progress-sync";
import { resetProgress as resetLocalProgress, setProgressOwner, subscribeProgressWrites } from "@/lib/progress-storage";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  progressSync: ProgressSyncSnapshot;
  resetProgress: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressSync, setProgressSync] = useState<ProgressSyncSnapshot>({
    status: "idle",
    userId: null,
    message: null,
  });
  const coordinatorRef = useRef<ProgressSyncCoordinator | null>(null);

  useEffect(() => {
    let mounted = true;
    let authGeneration = 0;
    const storage = {
      getItem: (key: string) => window.localStorage.getItem(key),
      setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
      removeItem: (key: string) => window.localStorage.removeItem(key),
    };
    const coordinator = createProgressSyncCoordinator({
      rpc: createProgressRpcAdapter(supabase),
      storage,
      locks: navigator.locks,
      setProgressOwner,
      notifyProgress: () => window.dispatchEvent(new Event("faa107-progress")),
    });
    coordinatorRef.current = coordinator;
    const unsubscribeSync = coordinator.subscribe((next) => {
      if (mounted) setProgressSync(next);
    });
    const unsubscribeWrites = subscribeProgressWrites((_progress, ownerUserId) => {
      if (ownerUserId) coordinator.localWrite();
    });

    const flushOnline = () => { void coordinator.flush("online").catch(() => {}); };
    const flushVisibility = () => {
      void coordinator.flush(document.visibilityState === "hidden" ? "visibility" : "online").catch(() => {});
    };
    const flushPagehide = () => { void coordinator.flush("pagehide").catch(() => {}); };
    window.addEventListener("online", flushOnline);
    window.addEventListener("focus", flushOnline);
    document.addEventListener("visibilitychange", flushVisibility);
    window.addEventListener("pagehide", flushPagehide);

    const initialAuthGeneration = authGeneration;
    void supabase.auth.getUser()
      .then(({ data }) => {
        if (mounted && authGeneration === initialAuthGeneration) {
          setUser(data.user);
          setLoading(false);
          void coordinator.authChanged(data.user).catch(() => {});
        }
      })
      .catch(() => {
        if (mounted && authGeneration === initialAuthGeneration) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        authGeneration += 1;
        setUser(session?.user ?? null);
        setLoading(false);
        void coordinator.authChanged(session?.user ?? null).catch(() => {});
        if (session?.access_token) {
          void coordinator.authTokenChanged(session.access_token).catch(() => {});
        }
      }
    });

    return () => {
      mounted = false;
      authGeneration += 1;
      subscription.unsubscribe();
      unsubscribeSync();
      unsubscribeWrites();
      window.removeEventListener("online", flushOnline);
      window.removeEventListener("focus", flushOnline);
      document.removeEventListener("visibilitychange", flushVisibility);
      window.removeEventListener("pagehide", flushPagehide);
      coordinator.dispose();
      if (coordinatorRef.current === coordinator) coordinatorRef.current = null;
    };
  }, [supabase]);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    router.refresh();
  }

  async function resetProgress() {
    if (loading) throw new Error("Account status is still loading. Please try again.");
    if (!user) {
      resetLocalProgress();
      return;
    }
    const coordinator = coordinatorRef.current;
    if (!coordinator) throw new Error("Progress sync is unavailable. Please try again.");
    await coordinator.reset();
  }

  return (
    <AuthContext.Provider value={{ user, loading, progressSync, resetProgress, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
