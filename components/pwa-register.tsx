"use client";

import { useEffect } from "react";

/** Registers the PWA worker after the page has finished loading. */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // A service worker's cache-first strategy conflicts with Turbopack's
    // development chunks, whose URLs may be reused after a source change.
    // Keep PWA caching for production, but remove any previous registration
    // while working locally so Fast Refresh receives the current bundle.
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister()))
      );
      return;
    }

    const register = () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
