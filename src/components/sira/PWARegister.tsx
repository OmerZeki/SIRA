"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys.filter((key) => key.startsWith("sira-")).forEach((key) => caches.delete(key));
        });
      }
      return;
    }

    if ((window as any).workbox === undefined) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("SIRA PWA Service Worker registered with scope: ", reg.scope);
        })
        .catch((err) => {
          console.error("SIRA PWA Service Worker registration failed: ", err);
        });
    }
  }, []);

  return null;
}
