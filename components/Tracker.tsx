"use client";
import { useEffect } from "react";

export function Tracker() {
  useEffect(() => {
    const key = "tracked-once";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch("/api/track", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
