"use client";

import { useState } from "react";

export function ShareRow({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (http, old browser) — fall back to prompt
      window.prompt("Copy link:", url);
    }
  };

  const enc = encodeURIComponent;
  const link =
    "text-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-150";

  return (
    <span className="font-sans text-[13px]">
      <span className="text-[var(--muted)] mr-3">Share</span>
      <a
        className={link}
        href={`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        X
      </a>
      <span className="mx-2 text-[var(--border)]">·</span>
      <a
        className={link}
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        LinkedIn
      </a>
      <span className="mx-2 text-[var(--border)]">·</span>
      <a className={link} href={`mailto:?subject=${enc(title)}&body=${enc(url)}`}>
        Email
      </a>
      <span className="mx-2 text-[var(--border)]">·</span>
      <button type="button" onClick={copy} className={`${link} cursor-pointer`}>
        {copied ? "Copied ✓" : "Copy link"}
      </button>
    </span>
  );
}
