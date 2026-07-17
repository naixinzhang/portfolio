"use client";

import React, { useMemo, useState } from "react";
import {
  SimFrame,
  Slider,
  Stat,
  Tabs,
  Btn,
  Toggle,
  Z95,
  pct,
  fmt,
  scaler,
  mulberry32,
  gaussian,
} from "./kit";

/* ---------------- helpers ---------------- */

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

// deterministic per-index seed (SSR-safe: no Math.random / Date)
function seedFor(index: number): number {
  return (Math.imul(index + 1, 0x9e3779b1) >>> 0) || 1;
}

// draw a score = successes / n where successes ~ Binomial(n, p)
function sampleScore(seedNum: number, n: number, p: number): number {
  const rand = mulberry32(seedNum);
  let s = 0;
  for (let i = 0; i < n; i++) if (rand() < p) s++;
  return s / n;
}

function halfWidth(p: number, n: number): number {
  return Z95 * Math.sqrt((p * (1 - p)) / n);
}

export default function ErrorBarSimulator() {
  const [tab, setTab] = useState(0);
  return (
    <SimFrame title="The Error-Bar Simulator">
      <Tabs
        tabs={["One score", "Clustered", "Leaderboard"]}
        active={tab}
        onChange={setTab}
      />
      {tab === 0 ? <OneScore /> : tab === 1 ? <Clustered /> : <Leaderboard />}
    </SimFrame>
  );
}

/* ---------------- Tab 1 — One score ---------------- */

const TRAIL = 20;

function OneScore() {
  const [trueScore, setTrueScore] = useState(30); // percent
  const [n, setN] = useState(117);
  const [runs, setRuns] = useState(1); // total resamples ever taken

  const p = trueScore / 100;

  // window of the last ~TRAIL resample points, derived deterministically
  const points = useMemo(() => {
    const start = Math.max(0, runs - TRAIL);
    const arr: number[] = [];
    for (let i = start; i < runs; i++) arr.push(sampleScore(seedFor(i), n, p));
    return arr;
  }, [runs, n, p]);

  const current = points[points.length - 1] ?? p;
  const hw = halfWidth(current, n);
  const lo = clamp(current - hw, 0, 1);
  const hi = clamp(current + hw, 0, 1);
  const contains = p >= lo && p <= hi;

  const W = 540;
  const H = 190;
  const m = { l: 44, r: 20, t: 26, b: 34 };
  const x = scaler(0, 1, m.l, W - m.r);
  const ghostTop = m.t + 8;
  const ghostBot = H - m.b - 34;
  const cy = H - m.b - 14;
  const barColor = contains ? "#2f8f4e" : "#d64541";

  return (
    <>
      <div className="sim-controls">
        <Slider
          label="True score"
          value={trueScore}
          min={5}
          max={95}
          onChange={setTrueScore}
          display={`${trueScore}%`}
        />
        <Slider
          label="Eval size n"
          value={n}
          min={20}
          max={500}
          onChange={setN}
          display={`n = ${n}`}
        />
        <Btn primary onClick={() => setRuns((r) => r + 1)}>
          Resample
        </Btn>
        <Btn onClick={() => setRuns((r) => r + 20)}>×20</Btn>
      </div>

      <div className="sim-scroll">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="sim-chart"
          role="img"
          aria-label="sampled score with 95% confidence interval on a 0 to 100 percent axis"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <g key={g}>
              <line
                x1={x(g)}
                x2={x(g)}
                y1={m.t}
                y2={H - m.b}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                x={x(g)}
                y={H - m.b + 16}
                textAnchor="middle"
                fontSize={10}
                fill="var(--muted)"
              >
                {pct(g, 0)}
              </text>
            </g>
          ))}
          <text
            x={(m.l + W - m.r) / 2}
            y={H - 3}
            textAnchor="middle"
            fontSize={10}
            fill="var(--muted)"
          >
            observed score
          </text>

          {/* true score reference */}
          <line
            x1={x(p)}
            x2={x(p)}
            y1={m.t}
            y2={H - m.b}
            stroke="var(--muted)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <text
            x={x(p)}
            y={m.t - 8}
            textAnchor="middle"
            fontSize={10}
            fill="var(--foreground)"
            fontWeight={600}
          >
            truth {trueScore}%
          </text>

          {/* ghost trail (all but the newest) */}
          {points.slice(0, -1).map((s, i) => {
            const idx = Math.max(0, runs - points.length) + i;
            const jitter = (seedFor(idx) % 1000) / 1000;
            const gy = ghostTop + jitter * (ghostBot - ghostTop);
            return (
              <circle
                key={idx}
                cx={x(s)}
                cy={gy}
                r={3}
                fill="var(--eb-accent)"
                opacity={0.28}
              />
            );
          })}

          {/* current point + 95% CI whisker */}
          <line
            x1={x(lo)}
            x2={x(hi)}
            y1={cy}
            y2={cy}
            stroke={barColor}
            strokeWidth={2.5}
          />
          <line x1={x(lo)} x2={x(lo)} y1={cy - 5} y2={cy + 5} stroke={barColor} strokeWidth={2} />
          <line x1={x(hi)} x2={x(hi)} y1={cy - 5} y2={cy + 5} stroke={barColor} strokeWidth={2} />
          <circle cx={x(current)} cy={cy} r={4.5} fill="var(--eb-accent)" />
        </svg>
      </div>

      <div className="sim-stats">
        <Stat label="sampled score" value={pct(current)} tone="accent" />
        <Stat label="95% CI half-width" value={`±${fmt(hw * 100, 1)} pts`} />
        <Stat
          label="CI contains truth?"
          value={contains ? "yes" : "no"}
          tone={contains ? "ok" : "warn"}
        />
        <Stat label="resamples in trail" value={`${points.length}`} sub={`n = ${n}`} />
      </div>

      <p className="sim-note">
        Each resample is <em>what if we had built the eval set from a different draw of n questions</em>.
        The point is one such draw with its 95% interval; the dashed line is the (unknowable) true score.
        The faint scatter is the trail of recent draws — that horizontal spread <em>is</em> the sampling
        variance a single number hides. Bigger n squeezes both the trail and the whisker.
      </p>
    </>
  );
}

/* ---------------- Tab 2 — Clustered ---------------- */

const CLUSTERS = 12;
const PER_CLUSTER = 10;
const N2 = CLUSTERS * PER_CLUSTER; // 120
const P2 = 0.3; // fixed true score
const BATCH = 100;

function runTrial(t: number, rho: number, sigma: number): { naive: boolean; cluster: boolean } {
  const rand = mulberry32((Math.imul(t + 1, 0x85ebca77) >>> 0) || 1);
  let succ = 0;
  for (let c = 0; c < CLUSTERS; c++) {
    const mu = clamp(P2 + gaussian(rand, 0, sigma), 0.001, 0.999);
    for (let j = 0; j < PER_CLUSTER; j++) if (rand() < mu) succ++;
  }
  const phat = succ / N2;
  const seNaive = Math.sqrt((phat * (1 - phat)) / N2);
  const naive = Math.abs(phat - P2) <= Z95 * seNaive;
  const neff = N2 / (1 + (PER_CLUSTER - 1) * rho);
  const seCluster = Math.sqrt((phat * (1 - phat)) / neff);
  const cluster = Math.abs(phat - P2) <= Z95 * seCluster;
  return { naive, cluster };
}

function Clustered() {
  const [rho, setRho] = useState(0.4);
  const [batches, setBatches] = useState(0);

  const sigma = Math.sqrt(rho * P2 * (1 - P2));
  const neff = N2 / (1 + (PER_CLUSTER - 1) * rho);

  const result = useMemo(() => {
    const total = batches * BATCH;
    let naive = 0;
    let cluster = 0;
    for (let t = 0; t < total; t++) {
      const r = runTrial(t, rho, sigma);
      if (r.naive) naive++;
      if (r.cluster) cluster++;
    }
    return { total, naive, cluster };
  }, [batches, rho, sigma]);

  const naiveCov = result.total ? result.naive / result.total : 0;
  const clusterCov = result.total ? result.cluster / result.total : 0;

  const W = 540;
  const H = 210;
  const m = { l: 46, r: 20, t: 20, b: 46 };
  const y = scaler(0, 1, H - m.b, m.t);
  const bandW = 96;
  const gap = 70;
  const cx0 = (W - m.l - m.r) / 2 + m.l;
  const bars: { label: string; cov: number; color: string; x: number }[] = [
    { label: "naive CI", cov: naiveCov, color: "#d64541", x: cx0 - gap - bandW / 2 },
    { label: "cluster-aware", cov: clusterCov, color: "#2f8f4e", x: cx0 + gap - bandW / 2 },
  ];

  return (
    <>
      <div className="sim-controls">
        <Slider
          label="Within-cluster correlation ρ"
          value={rho}
          min={0}
          max={0.9}
          step={0.05}
          onChange={setRho}
          display={`ρ = ${fmt(rho, 2)}`}
        />
        <Btn primary onClick={() => setBatches((b) => b + 1)}>
          Run 100 trials
        </Btn>
        <Btn onClick={() => setBatches(0)}>Reset</Btn>
      </div>

      <div className="sim-scroll">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="sim-chart"
          role="img"
          aria-label="coverage of naive and cluster-aware 95% intervals versus the 95% target"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <g key={g}>
              <line
                x1={m.l}
                x2={W - m.r}
                y1={y(g)}
                y2={y(g)}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text x={m.l - 6} y={y(g) + 3} textAnchor="end" fontSize={10} fill="var(--muted)">
                {pct(g, 0)}
              </text>
            </g>
          ))}

          {/* 95% target */}
          <line
            x1={m.l}
            x2={W - m.r}
            y1={y(0.95)}
            y2={y(0.95)}
            stroke="var(--foreground)"
            strokeWidth={1.5}
            strokeDasharray="5 3"
          />
          <text x={W - m.r} y={y(0.95) - 5} textAnchor="end" fontSize={10} fill="var(--foreground)" fontWeight={600}>
            95% target
          </text>

          {bars.map((b) => (
            <g key={b.label}>
              <rect
                x={b.x}
                y={y(b.cov)}
                width={bandW}
                height={y(0) - y(b.cov)}
                fill={b.color}
                opacity={0.85}
                rx={2}
              />
              <text
                x={b.x + bandW / 2}
                y={result.total ? y(b.cov) - 6 : y(0) - 6}
                textAnchor="middle"
                fontSize={12}
                fill="var(--foreground)"
                fontWeight={600}
              >
                {result.total ? pct(b.cov, 0) : "—"}
              </text>
              <text
                x={b.x + bandW / 2}
                y={H - m.b + 16}
                textAnchor="middle"
                fontSize={10}
                fill="var(--muted)"
              >
                {b.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="sim-stats">
        <Stat
          label="naive coverage"
          value={result.total ? pct(naiveCov, 0) : "—"}
          sub="claims 95%"
          tone="warn"
        />
        <Stat
          label="cluster-aware coverage"
          value={result.total ? pct(clusterCov, 0) : "—"}
          sub="claims 95%"
          tone="ok"
        />
        <Stat label="effective sample size" value={`n ≈ ${Math.round(neff)}`} sub={`of ${N2}`} tone="accent" />
        <Stat label="trials run" value={`${result.total}`} sub={`ρ = ${fmt(rho, 2)}`} />
      </div>

      <p className="sim-note">
        120 items in 12 clusters of 10; items within a cluster share a latent shift, so their answers
        correlate at ρ. The naive interval pretends all 120 are independent. When ρ is high a
        &ldquo;95%&rdquo; interval that actually covers the truth ~70% of the time is not a 95% interval —
        the correlation shrinks the effective sample to n ≈ {Math.round(neff)}, and only the cluster-aware
        interval (design effect 1 + 9ρ) hits the target.
      </p>
    </>
  );
}

/* ---------------- Tab 3 — Leaderboard ---------------- */

const TRUE3 = [0.31, 0.3, 0.27, 0.25, 0.22];
const NAMES3 = ["Model A", "Model B", "Model C", "Model D", "Model E"];

type Row = {
  name: string;
  trueP: number;
  obs: number;
  lo: number;
  hi: number;
  bestRank: number;
  worstRank: number;
};

function Leaderboard() {
  const [n, setN] = useState(120);
  const [mode, setMode] = useState(0); // 0 score, 1 upper bound, 2 rank range
  const [seed, setSeed] = useState(1);

  const rows = useMemo<Row[]>(() => {
    const rand = mulberry32((Math.imul(seed, 0x27d4eb2f) >>> 0) || 1);
    const base = TRUE3.map((trueP, i) => {
      let s = 0;
      for (let j = 0; j < n; j++) if (rand() < trueP) s++;
      const obs = s / n;
      const hw = halfWidth(obs, n);
      return {
        name: NAMES3[i],
        trueP,
        obs,
        lo: clamp(obs - hw, 0, 1),
        hi: clamp(obs + hw, 0, 1),
      };
    });
    // rank spans from CI overlap (rank 1 = best)
    return base.map((r) => {
      const clearlyAbove = base.filter((o) => o !== r && o.lo > r.hi).length;
      const clearlyBelow = base.filter((o) => o !== r && o.hi < r.lo).length;
      return { ...r, bestRank: 1 + clearlyAbove, worstRank: TRUE3.length - clearlyBelow };
    });
  }, [n, seed]);

  const sorted = useMemo<Row[]>(() => {
    const arr = [...rows];
    if (mode === 0) arr.sort((a, b) => b.obs - a.obs);
    else if (mode === 1) arr.sort((a, b) => b.hi - a.hi);
    else arr.sort((a, b) => a.bestRank - b.bestRank || a.worstRank - b.worstRank || b.obs - a.obs);
    return arr;
  }, [rows, mode]);

  const dmin = Math.max(0, Math.min(...rows.map((r) => r.lo)) - 0.01);
  const dmax = Math.min(1, Math.max(...rows.map((r) => r.hi)) + 0.01);

  const W = 540;
  const H = 236;
  const m = { l: 74, r: 54, t: 18, b: 30 };
  const x = scaler(dmin, dmax, m.l, W - m.r);
  const rowGap = (H - m.t - m.b) / sorted.length;

  const anyOverlap = rows.some((r) => r.bestRank !== r.worstRank);

  return (
    <>
      <div className="sim-controls">
        <Slider
          label="Tasks per model n"
          value={n}
          min={30}
          max={2000}
          step={10}
          onChange={setN}
          display={`n = ${n}`}
        />
        <Toggle
          options={["rank by score", "rank (upper bound)", "rank range"]}
          active={mode}
          onChange={setMode}
        />
        <Btn primary onClick={() => setSeed((s) => s + 1)}>
          Resample
        </Btn>
      </div>

      <div className="sim-scroll">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="sim-chart"
          role="img"
          aria-label="dot and whisker leaderboard of five models with 95% intervals"
        >
          {[dmin, (dmin + dmax) / 2, dmax].map((g, i) => (
            <g key={i}>
              <line x1={x(g)} x2={x(g)} y1={m.t} y2={H - m.b} stroke="var(--border)" strokeWidth={1} />
              <text x={x(g)} y={H - m.b + 16} textAnchor="middle" fontSize={10} fill="var(--muted)">
                {pct(g, 0)}
              </text>
            </g>
          ))}

          {sorted.map((r, i) => {
            const yy = m.t + rowGap * (i + 0.5);
            const top = i === 0;
            return (
              <g key={r.name}>
                <text
                  x={m.l - 8}
                  y={yy + 3}
                  textAnchor="end"
                  fontSize={11}
                  fill="var(--foreground)"
                  fontWeight={top ? 600 : 400}
                >
                  {r.name}
                </text>
                <line x1={x(r.lo)} x2={x(r.hi)} y1={yy} y2={yy} stroke="var(--muted)" strokeWidth={2} />
                <line x1={x(r.lo)} x2={x(r.lo)} y1={yy - 4} y2={yy + 4} stroke="var(--muted)" strokeWidth={2} />
                <line x1={x(r.hi)} x2={x(r.hi)} y1={yy - 4} y2={yy + 4} stroke="var(--muted)" strokeWidth={2} />
                <circle cx={x(r.obs)} cy={yy} r={4.5} fill={top ? "#c9821f" : "var(--eb-accent)"} />
                <text x={W - m.r + 6} y={yy + 3} fontSize={10} fill="var(--muted)">
                  {mode === 2 ? `rank ${r.bestRank}–${r.worstRank}` : pct(r.obs, 0)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="sim-stats">
        <Stat label="leader" value={sorted[0].name} sub={pct(sorted[0].obs, 1)} tone="accent" />
        <Stat label="CI half-width" value={`±${fmt(halfWidth(sorted[0].obs, n) * 100, 1)} pts`} sub={`n = ${n}`} />
        <Stat
          label="ranking is decided?"
          value={anyOverlap ? "no — a tie" : "yes"}
          tone={anyOverlap ? "warn" : "ok"}
        />
        <Stat label="ordering" value={["by score", "by upper bound", "by rank span"][mode]} />
      </div>

      <p className="sim-note">
        Five models within 9 points of each other. At n ≈ 120 the intervals overlap into a roughly
        five-way tie — drag n up and they separate. The three toggle columns are the <em>same</em> observed
        scores and the <em>same</em> 95% intervals: &ldquo;by score&rdquo; sorts the dots,
        &ldquo;upper bound&rdquo; sorts the optimistic edge, &ldquo;rank range&rdquo; reports the span of
        ranks each model could honestly hold. Different leaderboards, one dataset — the choice is editorial.
      </p>
    </>
  );
}
