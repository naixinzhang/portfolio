"use client";

import React, { useMemo, useState } from "react";
import {
  SimFrame,
  Slider,
  Stat,
  Tabs,
  Btn,
  Toggle,
  normalCdf,
  Z95,
  pct,
  fmt,
  scaler,
  mulberry32,
} from "./kit";

/* ================================================================== *
 * The Sample-Size & Stopping Simulator
 * Tab 1 (Power)   — analytic power curve for a two-proportion test.
 * Tab 2 (Peeking) — seeded A/A simulation showing peeking inflation.
 * ================================================================== */

export default function SampleSizeSimulator() {
  const [tab, setTab] = useState(0);
  return (
    <SimFrame title="The Sample-Size & Stopping Simulator">
      <Tabs tabs={["Power", "Peeking"]} active={tab} onChange={setTab} />
      {tab === 0 ? <PowerTab /> : <PeekingTab />}
    </SimFrame>
  );
}

/* ---------------- shared power math ---------------- */

// Two-sided normal-approx power at 95% given true difference (proportion).
function powerAt(dP: number, p: number, n: number, paired: boolean): number {
  const se = paired
    ? Math.sqrt(Math.max(dP, 0.1) / n) // McNemar: discordant rate d ≈ max(Δ, 0.1)
    : Math.sqrt((2 * p * (1 - p)) / n); // unpaired two-proportion
  if (se <= 0) return dP > 0 ? 1 : 0.05;
  const ncp = dP / se; // noncentrality
  return 1 - normalCdf(Z95 - ncp) + normalCdf(-Z95 - ncp);
}

// Smallest n per model reaching 80% power (null if unreachable / no effect).
function nFor80(dP: number, p: number, paired: boolean): number | null {
  if (dP <= 0) return null;
  let lo = 2;
  let hi = 500000;
  if (powerAt(dP, p, hi, paired) < 0.8) return null;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (powerAt(dP, p, mid, paired) >= 0.8) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/* ---------------- Tab 1 — Power ---------------- */

function PowerTab() {
  const [deltaPts, setDeltaPts] = useState(5);
  const [pPct, setPPct] = useState(70);
  const [n, setN] = useState(492);
  const [mode, setMode] = useState(0); // 0 = unpaired, 1 = paired
  const paired = mode === 1;

  const dP = deltaPts / 100;
  const p = pPct / 100;

  const se = paired
    ? Math.sqrt(Math.max(dP, 0.1) / n)
    : Math.sqrt((2 * p * (1 - p)) / n);
  const ncp = se > 0 ? dP / se : 0;
  const powerNow = powerAt(dP, p, n, paired);
  const n80 = nFor80(dP, p, paired);

  // log-spaced n from 20 → 2000 for both curves
  const NP = 72;
  const lo = Math.log10(20);
  const hi = Math.log10(2000);
  const ns = useMemo(
    () =>
      Array.from({ length: NP }, (_, i) =>
        Math.round(Math.pow(10, lo + ((hi - lo) * i) / (NP - 1)))
      ),
    [lo, hi]
  );
  const curveUnpaired = ns.map((nn) => powerAt(dP, p, nn, false));
  const curvePaired = ns.map((nn) => powerAt(dP, p, nn, true));

  const W = 540;
  const H = 260;
  const m = { l: 44, r: 74, t: 14, b: 40 };
  const x = scaler(lo, hi, m.l, W - m.r);
  const y = scaler(0, 1, H - m.b, m.t);
  const lx = (nn: number) => x(Math.log10(nn));
  const pathOf = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"}${lx(ns[i])},${y(v)}`).join(" ");

  const ticks = [20, 50, 100, 200, 500, 1000, 2000];
  const n80InRange = n80 !== null && n80 <= 2000;

  return (
    <>
      <div className="sim-controls">
        <Slider
          label="True difference Δ (pts)"
          value={deltaPts}
          min={0}
          max={20}
          onChange={setDeltaPts}
          display={`${deltaPts} pts`}
        />
        <Slider
          label="Base accuracy p (%)"
          value={pPct}
          min={50}
          max={95}
          onChange={setPPct}
          display={`${pPct}%`}
        />
        <Slider
          label="n per model"
          value={n}
          min={20}
          max={2000}
          onChange={setN}
          display={`n = ${n}`}
        />
        <Toggle
          options={["unpaired", "paired (McNemar)"]}
          active={mode}
          onChange={setMode}
        />
      </div>

      <div className="sim-scroll">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="sim-chart"
          role="img"
          aria-label="Statistical power versus sample size per model on a log axis"
        >
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((g) => (
            <g key={g}>
              <line
                x1={m.l}
                x2={W - m.r}
                y1={y(g)}
                y2={y(g)}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text x={m.l - 6} y={y(g) + 3} textAnchor="end" fontSize={10}>
                {pct(g, 0)}
              </text>
            </g>
          ))}
          {ticks.map((t) => (
            <text
              key={t}
              x={lx(t)}
              y={H - m.b + 16}
              textAnchor="middle"
              fontSize={10}
            >
              {t}
            </text>
          ))}
          <text
            x={(m.l + W - m.r) / 2}
            y={H - 4}
            textAnchor="middle"
            fontSize={10}
          >
            n per model (log scale)
          </text>

          {/* 80% target */}
          <line
            x1={m.l}
            x2={W - m.r}
            y1={y(0.8)}
            y2={y(0.8)}
            stroke="#2f8f4e"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <text x={W - m.r - 2} y={y(0.8) - 4} textAnchor="end" fontSize={10} fill="#2f8f4e">
            80% target
          </text>

          {/* both power curves; active drawn bolder */}
          <path
            d={pathOf(curveUnpaired)}
            fill="none"
            stroke="var(--eb-accent)"
            strokeWidth={paired ? 1.4 : 2.6}
            opacity={paired ? 0.5 : 1}
          />
          <path
            d={pathOf(curvePaired)}
            fill="none"
            stroke="#c9821f"
            strokeWidth={paired ? 2.6 : 1.4}
            opacity={paired ? 1 : 0.5}
          />

          {/* current n marker */}
          <line
            x1={lx(n)}
            x2={lx(n)}
            y1={m.t}
            y2={H - m.b}
            stroke="var(--muted)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <circle
            cx={lx(n)}
            cy={y(powerNow)}
            r={4}
            fill={paired ? "#c9821f" : "var(--eb-accent)"}
          />

          {/* n for 80% power */}
          {n80InRange ? (
            <>
              <line
                x1={lx(n80 as number)}
                x2={lx(n80 as number)}
                y1={y(0.8)}
                y2={H - m.b}
                stroke="#2f8f4e"
                strokeWidth={1.5}
              />
              <circle cx={lx(n80 as number)} cy={y(0.8)} r={4} fill="#2f8f4e" />
              <text
                x={lx(n80 as number)}
                y={H - m.b - 6}
                textAnchor="middle"
                fontSize={10}
                fill="#2f8f4e"
              >
                n₈₀ = {n80}
              </text>
            </>
          ) : null}

          <text
            x={W - m.r + 6}
            y={y(curveUnpaired[NP - 1]) + 3}
            fontSize={11}
            fill="var(--eb-accent)"
            fontWeight={600}
          >
            unpaired
          </text>
          <text
            x={W - m.r + 6}
            y={y(curvePaired[NP - 1]) + 3}
            fontSize={11}
            fill="#c9821f"
            fontWeight={600}
          >
            paired
          </text>
        </svg>
      </div>

      <div className="sim-stats">
        <Stat
          label="power at current n"
          value={pct(powerNow, 0)}
          sub={paired ? "paired (McNemar)" : "unpaired"}
          tone={powerNow >= 0.8 ? "ok" : "warn"}
        />
        <Stat
          label="n for 80% power"
          value={n80 === null ? "—" : `${n80}`}
          sub={n80 === null ? "no true effect" : n80 > 2000 ? "off-chart" : "per model"}
          tone="accent"
        />
        <Stat label="SE per model" value={`±${fmt(se * 100, 2)} pts`} />
        <Stat label="effect size Δ/SE" value={fmt(ncp, 2)} sub="noncentrality" />
      </div>

      <p className="sim-note">
        Fully analytic — no simulation. Power is the probability of a significant
        result at two-sided 95% when the true gap is Δ. Because the detectable
        effect enters as Δ² in the denominator, <em>halving Δ quadruples the n</em>{" "}
        you need. Pairing each item across the two models (McNemar) cancels the
        shared item difficulty, shrinking the SE, so the amber curve clears 80%
        far sooner than the blue one.
      </p>
    </>
  );
}

/* ---------------- Tab 2 — Peeking ---------------- */

const N_EXP = 200; // experiments
const BATCH = 20; // items per model per batch
const N_MAX = 500; // final sample per model
const LOOKS = N_MAX / BATCH; // 25 looks
const P_TRUE = 0.7; // A/A: both models truly 70%, Δ = 0
const ALPHA = 0.05;
const INV_ALPHA = 1 / ALPHA; // mSPRT reject threshold on the mixture LR
const TAU2 = 0.02; // mSPRT mixing variance (validity holds for any τ² > 0)

const LOOK_NS = Array.from({ length: LOOKS }, (_, i) => (i + 1) * BATCH);

// mSPRT mixture likelihood ratio for a null-standardized running z at sample n.
function mixtureLR(z: number, n: number): number {
  const phi = n * TAU2;
  return Math.exp(-0.5 * Math.log(1 + phi) + (z * z * phi) / (2 * (1 + phi)));
}
// Always-valid |z| boundary (for drawing the widening envelope).
function mixtureZBoundary(n: number): number {
  const phi = n * TAU2;
  const z2 = ((2 * (1 + phi)) / phi) * (Math.log(INV_ALPHA) + 0.5 * Math.log(1 + phi));
  return Math.sqrt(z2);
}

type Walk = { zs: number[]; crossedNaive: boolean };
type SimResult = {
  walks: Walk[];
  fpOnce: number; // look once at n=500
  fpPeek: number; // stop at first significant look
  fpMsprt: number; // always-valid
};

function runPeeking(seed: number): SimResult {
  const walks: Walk[] = [];
  let nOnce = 0;
  let nPeek = 0;
  let nMsprt = 0;

  for (let e = 0; e < N_EXP; e++) {
    const rand = mulberry32((seed * 1_000_003 + e + 1) >>> 0);
    let cA = 0;
    let cB = 0;
    const zs: number[] = [];
    let crossedNaive = false;
    let crossedMsprt = false;

    for (let i = 1; i <= N_MAX; i++) {
      if (rand() < P_TRUE) cA++;
      if (rand() < P_TRUE) cB++;
      if (i % BATCH === 0) {
        const n = i;
        const diff = (cA - cB) / n;
        const pooled = (cA + cB) / (2 * n);
        const se = Math.sqrt((2 * pooled * (1 - pooled)) / n);
        const z = se > 0 ? diff / se : 0;
        zs.push(z);
        if (Math.abs(z) > Z95) crossedNaive = true;
        if (mixtureLR(z, n) >= INV_ALPHA) crossedMsprt = true;
      }
    }

    if (Math.abs(zs[zs.length - 1]) > Z95) nOnce++; // single look at n=500
    if (crossedNaive) nPeek++; // stop at first significant
    if (crossedMsprt) nMsprt++; // always-valid

    walks.push({ zs, crossedNaive });
  }

  return {
    walks,
    fpOnce: nOnce / N_EXP,
    fpPeek: nPeek / N_EXP,
    fpMsprt: nMsprt / N_EXP,
  };
}

function PeekingTab() {
  const [seed, setSeed] = useState(4);
  const sim = useMemo(() => runPeeking(seed), [seed]);

  const W = 540;
  const H = 280;
  const m = { l: 44, r: 16, t: 14, b: 40 };
  const ZCLAMP = 4;
  const x = scaler(BATCH, N_MAX, m.l, W - m.r);
  const y = scaler(-ZCLAMP, ZCLAMP, H - m.b, m.t);
  const clamp = (z: number) => Math.max(-ZCLAMP, Math.min(ZCLAMP, z));

  const walkPath = (zs: number[]) =>
    zs
      .map((z, i) => `${i === 0 ? "M" : "L"}${x(LOOK_NS[i])},${y(clamp(z))}`)
      .join(" ");

  const boundPath = (sign: number) =>
    LOOK_NS.map(
      (n, i) =>
        `${i === 0 ? "M" : "L"}${x(n)},${y(clamp(sign * mixtureZBoundary(n)))}`
    ).join(" ");

  const nCrossed = sim.walks.filter((w) => w.crossedNaive).length;

  return (
    <>
      <div className="sim-controls">
        <Btn primary onClick={() => setSeed((s) => s + 1)}>
          Run 200 experiments
        </Btn>
        <Btn onClick={() => setSeed(4)}>Reset</Btn>
      </div>

      <div className="sim-scroll">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="sim-chart"
          role="img"
          aria-label="Running z-statistic random walks for 200 A/A experiments across 25 looks"
        >
          {[-4, -2, 0, 2, 4].map((z) => (
            <g key={z}>
              <line
                x1={m.l}
                x2={W - m.r}
                y1={y(z)}
                y2={y(z)}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text x={m.l - 6} y={y(z) + 3} textAnchor="end" fontSize={10}>
                {z > 0 ? `+${z}` : z}
              </text>
            </g>
          ))}
          {[100, 200, 300, 400, 500].map((t) => (
            <text key={t} x={x(t)} y={H - m.b + 16} textAnchor="middle" fontSize={10}>
              {t}
            </text>
          ))}
          <text x={(m.l + W - m.r) / 2} y={H - 4} textAnchor="middle" fontSize={10}>
            n per model · z-statistic (true Δ = 0)
          </text>

          {/* ±1.96 fixed-threshold bands */}
          {[Z95, -Z95].map((z) => (
            <line
              key={z}
              x1={m.l}
              x2={W - m.r}
              y1={y(z)}
              y2={y(z)}
              stroke="#d64541"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          ))}

          {/* the 200 walks */}
          {sim.walks.map((w, i) => (
            <path
              key={i}
              d={walkPath(w.zs)}
              fill="none"
              stroke={w.crossedNaive ? "#d64541" : "var(--muted)"}
              strokeWidth={0.8}
              opacity={w.crossedNaive ? 0.35 : 0.16}
            />
          ))}

          {/* always-valid mSPRT envelope */}
          <path d={boundPath(1)} fill="none" stroke="#2f8f4e" strokeWidth={1.5} strokeDasharray="2 3" />
          <path d={boundPath(-1)} fill="none" stroke="#2f8f4e" strokeWidth={1.5} strokeDasharray="2 3" />

          <text x={W - m.r - 2} y={y(Z95) - 4} textAnchor="end" fontSize={10} fill="#d64541">
            ±1.96
          </text>
          <text x={x(N_MAX) - 2} y={y(clamp(mixtureZBoundary(N_MAX))) - 4} textAnchor="end" fontSize={10} fill="#2f8f4e">
            mSPRT
          </text>
        </svg>
      </div>

      <div className="sim-stats">
        <Stat
          label="look once at n=500"
          value={pct(sim.fpOnce, 1)}
          sub="honest single test"
          tone={sim.fpOnce <= 0.08 ? "ok" : "warn"}
        />
        <Stat
          label="stop at first sig. look"
          value={pct(sim.fpPeek, 1)}
          sub={`${nCrossed}/${N_EXP} ever crossed`}
          tone="warn"
        />
        <Stat
          label="mSPRT (always-valid)"
          value={pct(sim.fpMsprt, 1)}
          sub="peek as often as you like"
          tone="ok"
        />
      </div>

      <p className="sim-note">
        An A/A test: both models are truly 70% accurate, so <em>every</em>{" "}
        significant result is a false positive. Each faint line is one
        experiment&rsquo;s running z-statistic across {LOOKS} looks. A single
        honest test at n = 500 flags ~5% — exactly the nominal rate. But{" "}
        <span style={{ color: "#d64541" }}>stopping the moment |z| crosses ±1.96</span>{" "}
        gives the walk {LOOKS} chances to wander out and keeps the maximum,
        inflating 5% to ~30%. The{" "}
        <span style={{ color: "#2f8f4e" }}>mSPRT envelope</span> widens with n so
        that peeking as often as you like still holds the false-positive rate at
        or below 5%.
      </p>
    </>
  );
}
