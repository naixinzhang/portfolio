"use client";
import dynamic from "next/dynamic";

const VisitorMap = dynamic(() => import("./VisitorMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] w-full max-w-xl mx-auto border border-[var(--border)] rounded-sm flex items-center justify-center text-xs text-[var(--muted)]">
      Loading map…
    </div>
  ),
});

export default VisitorMap;
