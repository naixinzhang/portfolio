"use client";

import React, { useMemo, useState } from "react";
import {
  SimFrame,
  Slider,
  Stat,
  Tabs,
  Btn,
  mean,
  variance,
  pct,
  scaler,
  mulberry32,
  logChoose,
  intFmt,
} from "./kit";

const KMAX = 16;
const POOL = 200;
const K = 3; // budget-allocator k

/* per-task true probabilities from a hard↔easy mix (0..1) */
function tasksFromMix(mix: number): number[] {
  const pEasy = 0.75 + 0.2 * mix;
  const pMed = 0.35 + 0.3 * mix;
  const pHard = 0.05 + 0.2 * mix;
  const out: number[] = [];
  for (let i = 0; i < 15; i++) out.push(pEasy);
  for (let i = 0; i < 10; i++) out.push(pMed);
  for (let i = 0; i < 15; i++) out.push(pHard);
  return out;
}

function passAtK(ps: number[], k: number): number {
  return mean(ps.map((p) => 1 - Math.pow(1 - p, k)));
}
function passHatK(ps: number[], k: number): number {
  return mean(ps.map((p) => Math.pow(p, k)));
}

/* fixed heterogeneous pool for the budget tab (true pass@3 ≈ 0.74) */
function buildPool(): number[] {
  const rand = mulberry32(7);
  const out: number[] = [];
  for (let i = 0; i < POOL; i++) {
    const r = rand();
    const base = r < 0.375 ? 0.9 : r < 0.625 ? 0.5 : 0.15;
    out.push(Math.min(0.99, Math.max(0.02, base + (rand() - 0.5) * 0.06)));
  }
  return out;
}

/* analytic SE of aggregate pass@3 at (budget B, runs-per-task n) */
function seCurve(pool: number[], B: number, n: number): number {
  const T = Math.min(Math.floor(B / n), POOL);
  if (T < 2) return NaN;
  const v = pool.map((p) => 1 - Math.pow(1 - p, K));
  const between = variance(v);
  // grouping-style within-task variance for pass@3 from n runs
  const within = mean(v.map((vt) => (K * vt * (1 - vt)) / n));
  return Math.sqrt(between / T + within / T);
}

export default function PasskExplorer() {
  const [tab, setTab] = useState(0);
  return (
    <SimFrame title="The pass@k Explorer">
      <Tabs
        tabs={["The two curves", "Budget allocator"]}
        active={tab}
        onChange={setTab}
      />
      {tab === 0 ? <TwoCurves /> : <BudgetAllocator />}
    </SimFrame>
  );
}

/* ---------------- Tab 1 ---------------- */

function TwoCurves() {
  const [mix, setMix] = useState(50);
  const [k, setK] = useState(8);
  const ps = useMemo(() => tasksFromMix(mix / 100), [mix]);

  const cap = useMemo(
    () => Array.from({ length: KMAX }, (_, i) => passAtK(ps, i + 1)),
    [ps]
  );
  const rel = useMemo(
    () => Array.from({ length: KMAX }, (_, i) => passHatK(ps, i + 1)),
    [ps]
  );
  const p1 = passAtK(ps, 1);
  const pk = passAtK(ps, k);
  const hk = passHatK(ps, k);

  const W = 540;
  const H = 260;
  const m = { l: 42, r: 90, t: 14, b: 34 };
  const x = scaler(1, KMAX, m.l, W - m.r);
  const y = scaler(0, 1, H - m.b, m.t);
  const path = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"}${x(i + 1)},${y(v)}`).join(" ");

  return (
    <>
      <div className="sim-controls">
        <Slider
          label="Task mix (hard ↔ easy)"
          value={mix}
          min={0}
          max={100}
          onChange={setMix}
          display={mix < 34 ? "harder" : mix > 66 ? "easier" : "balanced"}
        />
        <Slider label="Attempts k" value={k} min={1} max={KMAX} onChange={setK} display={`k = ${k}`} />
      </div>

      <div className="sim-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} className="sim-chart" role="img" aria-label="pass@k and pass^k versus number of attempts">
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <g key={g}>
              <line x1={m.l} x2={W - m.r} y1={y(g)} y2={y(g)} stroke="var(--border)" strokeWidth={1} />
              <text x={m.l - 6} y={y(g) + 3} textAnchor="end" fontSize={10}>{pct(g, 0)}</text>
            </g>
          ))}
          {[1, 4, 8, 12, 16].map((t) => (
            <text key={t} x={x(t)} y={H - m.b + 16} textAnchor="middle" fontSize={10}>{t}</text>
          ))}
          <text x={(m.l + W - m.r) / 2} y={H - 2} textAnchor="middle" fontSize={10}>attempts k</text>

          <path d={path(cap)} fill="none" stroke="var(--eb-accent)" strokeWidth={2.5} />
          <path d={path(rel)} fill="none" stroke="#c9821f" strokeWidth={2.5} />

          {/* gap at current k */}
          <line x1={x(k)} x2={x(k)} y1={y(pk)} y2={y(hk)} stroke="var(--muted)" strokeWidth={1} strokeDasharray="3 3" />
          <circle cx={x(k)} cy={y(pk)} r={4} fill="var(--eb-accent)" />
          <circle cx={x(k)} cy={y(hk)} r={4} fill="#c9821f" />

          <text x={W - m.r + 6} y={y(cap[KMAX - 1]) + 3} fontSize={11} fill="var(--eb-accent)" fontWeight={600}>pass@k</text>
          <text x={W - m.r + 6} y={y(rel[KMAX - 1]) + 3} fontSize={11} fill="#c9821f" fontWeight={600}>pass^k</text>
        </svg>
      </div>

      <div className="sim-stats">
        <Stat label="pass@1" value={pct(p1)} sub="try once" />
        <Stat label={`pass@${k} · capability`} value={pct(pk)} sub="at least one" tone="accent" />
        <Stat label={`pass^${k} · reliability`} value={pct(hk)} sub="all k succeed" tone="warn" />
        <Stat label="gap" value={`${((pk - hk) * 100).toFixed(1)} pts`} sub="capability − reliability" />
      </div>

      <p className="sim-note">
        40 tasks with heterogeneous true p<sub>t</sub>. Both curves are exact population values — no
        sampling noise here. The widening vertical distance is the capability–reliability divergence:
        high pass@k with low pass^k means <em>capable but erratic</em>. At k = 1 the two are the same number.
      </p>
    </>
  );
}

/* ---------------- Tab 2 ---------------- */

function BudgetAllocator() {
  const pool = useMemo(buildPool, []);
  const [B, setB] = useState(1200);
  const [n, setN] = useState(6);
  const [seed, setSeed] = useState(1);

  const T = Math.min(Math.floor(B / n), POOL);
  const truth = useMemo(
    () => mean(pool.map((p) => 1 - Math.pow(1 - p, K))),
    [pool]
  );
  const se = seCurve(pool, B, n);

  // one simulated campaign for the point estimate (deterministic in seed)
  const estimate = useMemo(() => {
    const rand = mulberry32(seed * 1000 + n);
    const ests: number[] = [];
    for (let t = 0; t < T; t++) {
      const p = pool[t];
      let c = 0;
      for (let r = 0; r < n; r++) if (rand() < p) c++;
      // unbiased pass@3: 1 - C(n-c,3)/C(n,3)
      const lc = logChoose(n - c, K) - logChoose(n, K);
      ests.push(1 - (n - c >= K ? Math.exp(lc) : 0));
    }
    return mean(ests);
  }, [pool, T, n, seed]);

  const ns = Array.from({ length: 30 }, (_, i) => i + 3); // 3..32
  const curve = ns.map((nn) => ({ n: nn, se: seCurve(pool, B, nn) }));
  const best = curve.reduce((a, b) => (b.se < a.se ? b : a), curve[0]);

  const W = 540;
  const H = 240;
  const m = { l: 46, r: 16, t: 14, b: 40 };
  const maxSE = Math.max(...curve.map((c) => c.se));
  const x = scaler(3, 32, m.l, W - m.r);
  const y = scaler(0, maxSE * 1.05, H - m.b, m.t);

  return (
    <>
      <div className="sim-controls">
        <Slider label="Total run budget B" value={B} min={600} max={3000} step={100} onChange={setB} display={`${intFmt(B)} runs`} />
        <Slider label="Runs per task n (k = 3)" value={n} min={3} max={32} onChange={setN} display={`n = ${n}`} />
        <Btn onClick={() => setSeed((s) => s + 1)}>Resample sims</Btn>
      </div>

      <div className="sim-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} className="sim-chart" role="img" aria-label="standard error of aggregate pass@3 versus runs per task">
          {[0.25, 0.5, 0.75, 1].map((g) => {
            const val = maxSE * g;
            return (
              <g key={g}>
                <line x1={m.l} x2={W - m.r} y1={y(val)} y2={y(val)} stroke="var(--border)" strokeWidth={1} />
                <text x={m.l - 6} y={y(val) + 3} textAnchor="end" fontSize={10}>±{(val * 100).toFixed(1)}</text>
              </g>
            );
          })}
          {[3, 8, 16, 24, 32].map((t) => (
            <text key={t} x={x(t)} y={H - m.b + 16} textAnchor="middle" fontSize={10}>{t}</text>
          ))}
          <text x={(m.l + W - m.r) / 2} y={H - 4} textAnchor="middle" fontSize={10}>runs per task n (points = SE of aggregate pass@3)</text>

          <path d={curve.map((c, i) => `${i === 0 ? "M" : "L"}${x(c.n)},${y(c.se)}`).join(" ")} fill="none" stroke="var(--eb-accent)" strokeWidth={2.5} />

          <line x1={x(best.n)} x2={x(best.n)} y1={m.t} y2={H - m.b} stroke="#2f8f4e" strokeWidth={1} strokeDasharray="3 3" />
          <circle cx={x(best.n)} cy={y(best.se)} r={4} fill="#2f8f4e" />
          <text x={x(best.n) + 6} y={y(best.se) - 6} fontSize={10} fill="#2f8f4e">sweet spot n = {best.n}</text>

          <circle cx={x(n)} cy={y(se)} r={4} fill="var(--eb-accent)" />
        </svg>
      </div>

      <div className="sim-stats">
        <Stat label="tasks used" value={`${T}`} sub={`pool ${POOL}`} />
        <Stat label="runs used / budget" value={`${intFmt(T * n)} / ${intFmt(B)}`} />
        <Stat label="avg pass@3 estimate" value={pct(estimate)} sub={`truth ${pct(truth)}`} tone="accent" />
        <Stat label="SE at current n" value={`±${(se * 100).toFixed(2)} pts`} />
      </div>

      <p className="sim-note">
        Fixed budget, {POOL}-task pool, k = 3. Left of the sweet spot the budget saturates the pool;
        right of it you&rsquo;re buying reruns when the uncertainty lives between tasks. The heuristic:
        n ≈ 2k–3k runs per task, then spend the rest on new tasks.
      </p>
    </>
  );
}
