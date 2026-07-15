"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function isAuthPath(pathname: string) {
  return ["/auth", "/login", "/signup"].some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

export function ServiceWorkerRegistration() {
  const pathname = usePathname();
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production"
      || typeof window === "undefined"
      || !window.isSecureContext
      || !("serviceWorker" in navigator)
      || isAuthPath(pathname)) {
      return;
    }

    let disposed = false;
    let registration: ServiceWorkerRegistration | null = null;
    let installingWorker: ServiceWorker | null = null;

    const showWaitingUpdate = () => {
      if (!disposed && navigator.serviceWorker.controller) setUpdateReady(true);
    };
    const handleInstallingState = () => {
      if (installingWorker?.state === "installed") showWaitingUpdate();
    };
    const handleUpdateFound = () => {
      installingWorker?.removeEventListener("statechange", handleInstallingState);
      installingWorker = registration?.installing ?? null;
      installingWorker?.addEventListener("statechange", handleInstallingState);
    };
    const register = async () => {
      try {
        const nextRegistration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (disposed) return;
        registration = nextRegistration;
        if (registration.waiting) showWaitingUpdate();
        registration.addEventListener("updatefound", handleUpdateFound);
      } catch {
        // Offline support is an enhancement; registration failure must not block study.
      }
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    return () => {
      disposed = true;
      window.removeEventListener("load", register);
      registration?.removeEventListener("updatefound", handleUpdateFound);
      installingWorker?.removeEventListener("statechange", handleInstallingState);
    };
  }, [pathname]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production"
      || typeof window === "undefined"
      || !window.isSecureContext
      || !("serviceWorker" in navigator)
      || isAuthPath(pathname)) {
      return;
    }

    let disposed = false;
    void navigator.serviceWorker.ready
      .then((registration) => {
        if (disposed) return;
        const activeWorker = registration.active;
        if (!activeWorker) return;
        activeWorker.postMessage({
          type: "CACHE_PUBLIC_DOCUMENT",
          url: new URL(pathname, window.location.origin).href,
        });
      })
      .catch(() => {
        // Warming is best-effort and must not affect the current route.
      });

    return () => {
      disposed = true;
    };
  }, [pathname]);

  if (!updateReady) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-50 ml-auto max-w-md rounded-lg border border-amber-400/50 bg-slate-950 px-4 py-3 text-sm text-slate-100 shadow-2xl"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <strong className="text-amber-300">A course update is ready.</strong>{" "}
      Finish this study session, then close every FAA 107 tab or the installed app and reopen it to apply the update safely.
    </aside>
  );
}
