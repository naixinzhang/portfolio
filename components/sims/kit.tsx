"use client";

import React from "react";

/* ---------- seeded RNG (deterministic → SSR and first client render match) ---------- */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box–Muller gaussian from a uniform source
export function gaussian(rand: () => number, mean = 0, sd = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ---------- statistics ---------- */

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function variance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (xs.length - 1);
}

export function sd(xs: number[]): number {
  return Math.sqrt(variance(xs));
}

export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

const g = 7;
const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

export function logGamma(z: number): number {
  if (z < 0.5) {
    return (
      Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z)
    );
  }
  z -= 1;
  let x = LANCZOS[0];
  for (let i = 1; i < g + 2; i++) x += LANCZOS[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

export function logChoose(n: number, k: number): number {
  if (k < 0 || k > n) return -Infinity;
  return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
}

export function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  return Math.round(Math.exp(logChoose(n, k)));
}

export function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t -
      0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

export function normalCdf(x: number, mu = 0, s = 1): number {
  return 0.5 * (1 + erf((x - mu) / (s * Math.SQRT2)));
}

export const Z95 = 1.959963985;

/* ---------- formatting ---------- */

export function pct(x: number, digits = 1): string {
  return `${(x * 100).toFixed(digits)}%`;
}

export function fmt(x: number, digits = 2): string {
  return x.toFixed(digits);
}

// Deterministic thousands separator — locale-independent, so SSR and client
// render identically (Number.prototype.toLocaleString is locale-dependent and
// causes hydration mismatches).
export function intFmt(x: number): string {
  return Math.round(x)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/* ---------- SVG scale ---------- */

// Rounds outputs to 2 decimals. Coordinates derived from transcendental
// functions (pow/exp/erf) can differ in the last floating-point bit between the
// Node (SSR) and browser V8 builds; embedding those raw floats in SVG attributes
// causes hydration mismatches. Rounding at the source makes them byte-identical.
export function scaler(d0: number, d1: number, r0: number, r1: number) {
  return (v: number) =>
    Math.round((r0 + ((v - d0) / (d1 - d0)) * (r1 - r0)) * 100) / 100;
}

// Round any stray float before using it as an SVG attribute (same reason).
export function rnd(x: number, digits = 2): number {
  const f = Math.pow(10, digits);
  return Math.round(x * f) / f;
}

/* ---------- UI primitives ---------- */

export function SimFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sim-frame not-prose">
      <p className="sim-frame-title">{title}</p>
      {children}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  display?: string;
}) {
  return (
    <label className="sim-slider">
      <span className="sim-slider-row">
        <span className="sim-slider-label">{label}</span>
        <span className="sim-slider-value">{display ?? value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "accent" | "warn" | "ok" | "muted";
}) {
  return (
    <div className="sim-stat">
      <div className={`sim-stat-value${tone ? ` sim-tone-${tone}` : ""}`}>
        {value}
      </div>
      <div className="sim-stat-label">{label}</div>
      {sub ? <div className="sim-stat-sub">{sub}</div> : null}
    </div>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="sim-tabs" role="tablist">
      {tabs.map((t, i) => (
        <button
          key={t}
          role="tab"
          aria-selected={i === active}
          className={`sim-tab${i === active ? " sim-tab-active" : ""}`}
          onClick={() => onChange(i)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function Btn({
  onClick,
  children,
  primary,
}: {
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      className={`sim-btn${primary ? " sim-btn-primary" : ""}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function Toggle({
  options,
  active,
  onChange,
}: {
  options: string[];
  active: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="sim-toggle">
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          className={`sim-toggle-opt${i === active ? " sim-toggle-active" : ""}`}
          onClick={() => onChange(i)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
