"use client";
import { useSyncExternalStore } from "react";
function subscribe(callback: () => void) {
  const query = window.matchMedia("(max-width: 760px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const snapshot = () => window.matchMedia("(max-width: 760px)").matches;
const serverSnapshot = () => false;
export function useMobile() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
