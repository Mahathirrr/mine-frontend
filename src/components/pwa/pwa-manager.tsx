"use client";

import * as React from "react";

import { toast } from "@/components/ui/toast";

const SW_URL = "/sw.js";

export function PwaManager() {
  React.useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    void navigator.serviceWorker
      .register(SW_URL, { scope: "/", updateViaCache: "none" })
      .then(async (registration) => {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter(
                (key) =>
                  key === "pages-html" ||
                  key === "api-data" ||
                  key === "hashed-assets" ||
                  key.startsWith("workbox-precache"),
              )
              .map((key) => caches.delete(key)),
          );
        }

        await registration.update();

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch(() => {
        // Service worker is generated on production build only.
      });

    const onOffline = () => {
      toast.add({
        title: "Kamu offline",
        description: "Beberapa halaman yang pernah dibuka masih bisa diakses.",
        type: "info",
      });
    };

    const onOnline = () => {
      toast.add({
        title: "Kembali online",
        type: "success",
      });
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}
