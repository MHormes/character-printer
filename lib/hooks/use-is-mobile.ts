"use client";

import { useSyncExternalStore } from "react";

export function useIsMobile() {
  return useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia("(max-width: 767px)");
      mq.addEventListener("change", callback);
      return () => mq.removeEventListener("change", callback);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );
}
