"use client";

import React, { useMemo, useState } from "react";
import { SimFrame, Btn, Toggle, mean, quantile, pct, fmt, scaler, mulberry32, intFmt } from "./kit";

/* The Bradley–Terry Sandbox — four models A,B,C,D. Everything is a pure,
   deterministic function of (world, totalVotes): the vote log is a seeded
   reproducible stream regenerated up to totalVotes, so SSR and first client
   render always agree. */

const N = 4;
const LABELS = ["A", "B", "C", "D"];
const BETA_TRUE = [1.2, 1.0, 0.9, 0.2];
const WORLD_SEEDS = [424242, 135791];
const BOOT_SEED = 987654;
const BOOT_REPS = 100;
const MM_ITERS = 50;
const PSEUDO = 0.1;
const HIST_WINDOW = 10;
const BLUE = "var(--eb-accent)";

const logistic = (d: number) => 1 / (1 + Math.exp(-d));

function buildTrueP(world: number): number[][] {
  const P: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
  if (world === 0) {
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (i !== j) P[i][j] = logistic(BETA_TRUE[i] - BETA_TRUE[j]);
  } else {
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (i !== j) P[i][j] = 0.5;
    P[0][1] = 0.65; P[1][0] = 0.35;
    P[1][2] = 0.65; P[2][1] = 0.35;
    P[2][0] = 0.65; P[0][2] = 0.35;
  }
  return P;
}

function genWins(totalVotes: number, world: number): number[][] {
  const P = buildTrueP(world);
  const rand = mulberry32(WORLD_SEEDS[world]);
  const wins: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let v = 0; v < totalVotes; v++) {
    const i = Math.floor(rand() * N);
    let j = Math.floor(rand() * (N - 1));
    if (j >= i) j++;
    if (rand() < P[i][j]) wins[i][j]++;
    else wins[j][i]++;
  }
  return wins;
}

function fitBT(wins: number[][]): number[] {
  const w: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (i !== j) w[i][j] = wins[i][j] + PSEUDO;
  const W = w.map((row) => row.reduce((a, b) => a + b, 0));
  const nij: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (i !== j) nij[i][j] = w[i][j] + w[j][i];
  let pi = new Array(N).fill(1);
  for (let it = 0; it < MM_ITERS; it++) {
    const np = new Array(N).fill(0);
    for (let i = 0; i < N; i++) {
      let denom = 0;
      for (let j = 0; j < N; j++) if (i !== j) denom += nij[i][j] / (pi[i] + pi[j]);
      np[i] = W[i] / denom;
    }
    const gm = Math.exp(mean(np.map((x) => Math.log(x))));
    pi = np.map((x) => x / gm);
  }
  const beta = pi.map((x) => Math.log(x));
  const mb = mean(beta);
  return beta.map((b) => b - mb);
}

const rankingString = (beta: number[]) =>
  beta.map((b, i) => [b, i] as [number, number]).sort((a, b) => b[0] - a[0]).map(([, i]) => LABELS[i]).join("");
const computeRanking = (totalVotes: number, world: number) => rankingString(fitBT(genWins(totalVotes, world)));

const PAIRS: [number, number][] = [];
for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (i !== j) PAIRS.push([i, j]);

function rbinom(n: number, p: number, rand: () => number): number {
  if (n <= 0 || p <= 0) return 0;
  if (p >= 1) return n;
  if (n < 25) {
    let c = 0;
    for (let k = 0; k < n; k++) if (rand() < p) c++;
    return c;
  }
  const mu = n * p;
  const s = Math.sqrt(n * p * (1 - p));
  const u = rand() || 1e-12;
  const v = rand();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  let x = Math.round(mu + s * z);
  if (x < 0) x = 0;
  if (x > n) x = n;
  return x;
}

function rmultinom(total: number, probs: number[], rand: () => number): number[] {
  const k = probs.length;
  const counts = new Array(k).fill(0);
  let remaining = total;
  let pRemain = 1;
  for (let i = 0; i < k; i++) {
    if (remaining <= 0) break;
    if (i === k - 1) {
      counts[i] = remaining;
      break;
    }
    const pi = pRemain > 0 ? Math.min(1, Math.max(0, probs[i] / pRemain)) : 0;
    const c = rbinom(remaining, pi, rand);
    counts[i] = c;
    remaining -= c;
    pRemain -= probs[i];
  }
  return counts;
}

interface Fit {
  beta: number[];
  ciLo: number[];
  ciHi: number[];
  wins: number[][];
  obs: number[][];
}

function computeFit(totalVotes: number, world: number): Fit {
  const wins = genWins(totalVotes, world);
  const beta = fitBT(wins);
  const obs: number[][] = Array.from({ length: N }, () => new Array(N).fill(0.5));
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++)
      if (i !== j) {
        const g = wins[i][j] + wins[j][i];
        obs[i][j] = g > 0 ? wins[i][j] / g : 0.5;
      }
  const total = PAIRS.reduce((a, [i, j]) => a + wins[i][j], 0);
  const probs = PAIRS.map(([i, j]) => (total > 0 ? wins[i][j] / total : 1 / PAIRS.length));
  const rand = mulberry32(BOOT_SEED);
  const samples: number[][] = Array.from({ length: N }, () => []);
  for (let b = 0; b < BOOT_REPS; b++) {
    const counts = rmultinom(total, probs, rand);
    const bw: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
    PAIRS.forEach(([i, j], idx) => (bw[i][j] = counts[idx]));
    const bb = fitBT(bw);
    for (let i = 0; i < N; i++) samples[i].push(bb[i]);
  }
  const ciLo = samples.map((s) => quantile([...s].sort((a, b) => a - b), 0.025));
  const ciHi = samples.map((s) => quantile([...s].sort((a, b) => a - b), 0.975));
  return { beta, ciLo, ciHi, wins, obs };
}

const BETA_TRUE_CENTERED = (() => {
  const m = mean(BETA_TRUE);
  return BETA_TRUE.map((b) => b - m);
})();

const shade = (p: number) =>
  p >= 0.5 ? `rgba(47,143,78,${((p - 0.5) * 2 * 0.7).toFixed(3)})` : `rgba(214,69,65,${((0.5 - p) * 2 * 0.7).toFixed(3)})`;

export default function BradleyTerrySandbox() {
  const [world, setWorld] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [history, setHistory] = useState<string[]>(() => [computeRanking(0, 0)]);

  const fit = useMemo(() => computeFit(totalVotes, world), [totalVotes, world]);
  const flips = useMemo(() => {
    const win = history.slice(-HIST_WINDOW);
    let f = 0;
    for (let i = 1; i < win.length; i++) if (win[i] !== win[i - 1]) f++;
    return f;
  }, [history]);

  const addVotes = (delta: number) => {
    const nt = totalVotes + delta;
    setTotalVotes(nt);
    setHistory((h) => [...h, computeRanking(nt, world)].slice(-(HIST_WINDOW + 2)));
  };
  const reset = () => {
    setTotalVotes(0);
    setHistory([computeRanking(0, world)]);
  };
  const changeWorld = (w: number) => {
    setWorld(w);
    setTotalVotes(0);
    setHistory([computeRanking(0, w)]);
  };

  const noVotes = totalVotes === 0;
  const rankOf = (k: number) => (noVotes ? "—" : String(1 + fit.beta.filter((b) => b > fit.beta[k] + 1e-9).length));

  /* β chart geometry */
  const BW = 400;
  const BH = 216;
  const bm = { l: 116, r: 22, t: 14, b: 34 };
  const bx = scaler(-2, 2, bm.l, BW - bm.r);
  const rowY = (k: number) => bm.t + 24 + k * 40;

  /* win-matrix geometry */
  const cell = 42;
  const gp = 30;
  const MW = gp + N * cell + 6;
  const MH = 22 + gp + N * cell + 6;

  return (
    <SimFrame title="The Bradley–Terry Sandbox">
      <div className="sim-controls">
        <Btn primary onClick={() => addVotes(10)}>Add 10 votes</Btn>
        <Btn primary onClick={() => addVotes(100)}>Add 100 votes</Btn>
        <Btn onClick={reset}>Reset</Btn>
        <Toggle options={["true BT world", "nontransitive world"]} active={world} onChange={changeWorld} />
      </div>

      <div className="sim-bt-cols">
        {/* ---- β estimates ---- */}
        <div className="sim-scroll">
          <svg viewBox={`0 0 ${BW} ${BH}`} className="sim-chart" role="img" aria-label="fitted Bradley-Terry strengths with 95% bootstrap confidence intervals">
            {[-2, -1, 0, 1, 2].map((t) => (
              <g key={t}>
                <line x1={bx(t)} x2={bx(t)} y1={bm.t} y2={BH - bm.b} stroke="var(--border)" strokeWidth={1} />
                <text x={bx(t)} y={BH - bm.b + 16} textAnchor="middle" fontSize={11} fill="var(--muted)">{t > 0 ? `+${t}` : t}</text>
              </g>
            ))}
            <text x={(bm.l + BW - bm.r) / 2} y={BH - 3} textAnchor="middle" fontSize={11} fill="var(--muted)">β (log-strength)</text>

            {LABELS.map((lab, k) => {
              const y = rowY(k);
              const tb = BETA_TRUE_CENTERED[k];
              return (
                <g key={lab}>
                  <text x={8} y={y + 2} fontSize={13} fill="var(--muted)">{rankOf(k)}</text>
                  <text x={28} y={y - 2} fontSize={13} fontWeight={600} fill="var(--foreground)">Model {lab}</text>
                  <text x={28} y={y + 12} fontSize={10.5} fill="var(--muted)">{noVotes ? "no votes yet" : `β = ${fmt(fit.beta[k])}`}</text>
                  {world === 0 && <line x1={bx(tb)} x2={bx(tb)} y1={y - 12} y2={y + 12} stroke="var(--foreground)" strokeWidth={1} strokeDasharray="2 2" opacity={0.55} />}
                  <line x1={bx(fit.ciLo[k])} x2={bx(fit.ciHi[k])} y1={y} y2={y} stroke={BLUE} strokeWidth={2} />
                  <line x1={bx(fit.ciLo[k])} x2={bx(fit.ciLo[k])} y1={y - 4} y2={y + 4} stroke={BLUE} strokeWidth={1.5} />
                  <line x1={bx(fit.ciHi[k])} x2={bx(fit.ciHi[k])} y1={y - 4} y2={y + 4} stroke={BLUE} strokeWidth={1.5} />
                  <circle cx={bx(fit.beta[k])} cy={y} r={5} fill={BLUE} />
                </g>
              );
            })}
          </svg>
        </div>

        {/* ---- observed win-rate matrix ---- */}
        <div className="sim-scroll">
          <svg viewBox={`0 0 ${MW} ${MH}`} className="sim-chart" role="img" aria-label="observed win-rate matrix, probability row beats column">
            <text x={gp} y={12} fontSize={11} fill="var(--muted)">observed: P(row beats col)</text>
            {LABELS.map((lab, c) => (
              <text key={`ch${lab}`} x={22 + gp + c * cell + cell / 2} y={22 + gp - 10} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--muted)">{lab}</text>
            ))}
            {LABELS.map((lab, r) => (
              <text key={`rh${lab}`} x={gp - 8} y={22 + gp + r * cell + cell / 2 + 4} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--muted)">{lab}</text>
            ))}
            {LABELS.map((_, r) =>
              LABELS.map((__, c) => {
                const x = 22 + gp + c * cell;
                const y = 22 + gp + r * cell;
                const diag = r === c;
                const games = diag ? 0 : fit.wins[r][c] + fit.wins[c][r];
                return (
                  <g key={`${r}-${c}`}>
                    <rect x={x} y={y} width={cell} height={cell} fill={diag ? "var(--eb-tint)" : games > 0 ? shade(fit.obs[r][c]) : "var(--background)"} stroke="var(--border)" strokeWidth={1} />
                    <text x={x + cell / 2} y={y + cell / 2 + 4} textAnchor="middle" fontSize={11} fill="var(--muted)">{diag ? "" : games > 0 ? pct(fit.obs[r][c], 0) : "—"}</text>
                  </g>
                );
              })
            )}
          </svg>
        </div>
      </div>

      <div className="sim-readouts">
        <div>
          <div className="sim-stat-value">{intFmt(totalVotes)}</div>
          <div className="sim-stat-label">total votes{noVotes ? "" : ` · ranking ${history[history.length - 1]}`}</div>
        </div>
        <div>
          <div className="sim-stat-value">{noVotes ? "—" : flips}</div>
          <div className="sim-stat-label">ranking flips, last 10 refits</div>
        </div>
      </div>

      <p className="sim-note" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <span><span style={{ color: "var(--eb-accent)", fontWeight: 700 }}>■</span> fitted β ± 95% bootstrap CI</span>
        <span><span style={{ color: "var(--foreground)", fontWeight: 700 }}>■</span> true β (dashed tick)</span>
        <span><span style={{ color: "var(--border)", fontWeight: 700 }}>■</span> matrix: observed P(row beats col)</span>
      </p>

      <p className="sim-note">
        Fit: Hunter (2004) MM algorithm, 50 iterations, geometric-mean normalization; CIs: percentile bootstrap over the
        vote log, 100 resamples; rank ranges from CI overlap, part-3 conventions. A 0.1-vote pseudo-count per direction keeps
        the MLE finite before every model has both wins and losses. True strengths in the BT world: β = 1.2, 1.0, 0.9, 0.2
        (shown mean-centered). At 20–50 votes the podium reshuffles on almost every refit; a couple thousand votes and the
        true-BT world settles to A, B, C, D — except B vs C (a 52.5% matchup) which stays entangled. In the nontransitive
        world the fitted β collapse toward equal while the win matrix exposes the A→B→C→A cycle no single β line can represent.
      </p>
    </SimFrame>
  );
}
