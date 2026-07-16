"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const isOnline = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("online", onStoreChange);
      window.addEventListener("offline", onStoreChange);
      return () => {
        window.removeEventListener("online", onStoreChange);
        window.removeEventListener("offline", onStoreChange);
      };
    },
    () => navigator.onLine,
    () => true,
  );

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg animate-in fade-in slide-in-from-bottom-4">
      <WifiOff className="h-4 w-4" />
      Çevrimdışı moddasınız. Değişiklikler senkronize edilmeyecek.
    </div>
  );
}
