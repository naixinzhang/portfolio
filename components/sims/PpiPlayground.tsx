"use client";

import { useMemo, useState } from "react";
import { SimFrame, Slider, Btn, pct, scaler, mulberry32, Z95, intFmt } from "./kit";

/* The PPI Playground — four estimators, one truth.  sim id: ppi-playground
   300 eval campaigns: an imperfect judge labels N items, n of them also get a
   gold human label. Estimate the true pass rate θ four ways; track the last
   point estimate, the average CI half-width, and coverage across the 300. */

const CAMPAIGNS = 300;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

type EstAccum = { lastPoint: number; sumHalf: number; covered: number; sumEffN: number };
const emptyAccum = (): EstAccum => ({ lastPoint: 0, sumHalf: 0, covered: 0, sumEffN: 0 });
type SimResult = { naive: EstAccum; humans: EstAccum; rg: EstAccum; ppi: EstAccum };

function runSim(theta: number, tpr: number, tnr: number, N: number, n: number, seed: number): SimResult {
  const rand = mulberry32(((seed >>> 0) * 2654435761 + 1013904223) >>> 0);
  const naive = emptyAccum();
  const humans = emptyAccum();
  const rg = emptyAccum();
  const ppi = emptyAccum();
  const fpr = 1 - tnr;
  const thetaVar = theta * (1 - theta);

  for (let c = 0; c < CAMPAIGNS; c++) {
    let Sf = 0;
    for (let i = 0; i < N; i++) {
      const truePass = rand() < theta;
      const f = truePass ? (rand() < tpr ? 1 : 0) : rand() < fpr ? 1 : 0;
      Sf += f;
    }
    const pObs = Sf / N;

    let sumY = 0;
    let sumFY = 0;
    let sumFY2 = 0;
    let n1 = 0;
    let n0 = 0;
    let tp = 0;
    let tn = 0;
    for (let j = 0; j < n; j++) {
      const truePass = rand() < theta;
      const y = truePass ? 1 : 0;
      const f = truePass ? (rand() < tpr ? 1 : 0) : rand() < fpr ? 1 : 0;
      sumY += y;
      const fy = f - y;
      sumFY += fy;
      sumFY2 += fy * fy;
      if (y === 1) {
        n1++;
        if (f === 1) tp++;
      } else {
        n0++;
        if (f === 0) tn++;
      }
    }

    // 1. Judge alone (naive)
    {
      const half = Z95 * Math.sqrt((pObs * (1 - pObs)) / N);
      naive.lastPoint = pObs;
      naive.sumHalf += half;
      if (Math.abs(theta - pObs) <= half) naive.covered++;
    }
    // 2. Humans alone
    {
      const pH = sumY / n;
      const half = Z95 * Math.sqrt((pH * (1 - pH)) / n);
      humans.lastPoint = pH;
      humans.sumHalf += half;
      if (Math.abs(theta - pH) <= half) humans.covered++;
    }
    // 3. Rogan–Gladen (delta-method CI)
    {
      const Se = n1 > 0 ? tp / n1 : tpr;
      const Sp = n0 > 0 ? tn / n0 : tnr;
      const J = Se + Sp - 1;
      const Jden = Math.abs(J) < 0.05 ? (J < 0 ? -0.05 : 0.05) : J;
      const point = clamp01((pObs + Sp - 1) / Jden);
      const varP = (pObs * (1 - pObs)) / N;
      const varSe = (Se * (1 - Se)) / Math.max(n1, 1);
      const varSp = (Sp * (1 - Sp)) / Math.max(n0, 1);
      const v = (varP + point * point * varSe + (1 - point) * (1 - point) * varSp) / (Jden * Jden);
      const half = Z95 * Math.sqrt(v);
      rg.lastPoint = point;
      rg.sumHalf += half;
      if (Math.abs(theta - point) <= half) rg.covered++;
    }
    // 4. PPI
    {
      const rectifier = sumFY / n;
      const point = clamp01(pObs - rectifier);
      const varF = (pObs * (1 - pObs)) / N;
      const varFY = n > 1 ? (sumFY2 - (sumFY * sumFY) / n) / (n - 1) : 0;
      const v = varF + varFY / n;
      const half = Z95 * Math.sqrt(v);
      ppi.lastPoint = point;
      ppi.sumHalf += half;
      ppi.sumEffN += v > 0 ? thetaVar / v : 0;
      if (Math.abs(theta - point) <= half) ppi.covered++;
    }
  }
  return { naive, humans, rg, ppi };
}

const C_NAIVE = "#c0392b";
const C_HUM = "#8a8a8a";
const C_RG = "#7a4fa3";
const C_PPI = "var(--eb-accent)";

export default function PpiPlayground() {
  const [theta, setTheta] = useState(60);
  const [tpr, setTpr] = useState(95);
  const [tnr, setTnr] = useState(80);
  const [n, setN2] = useState(100);
  const [N, setN] = useState(5000);
  const [seed, setSeed] = useState(1);

  const thetaTrue = theta / 100;
  const sim = useMemo(() => runSim(thetaTrue, tpr / 100, tnr / 100, N, n, seed), [thetaTrue, tpr, tnr, N, n, seed]);

  const rows = [
    { key: "naive", label: "Judge alone, naive", color: C_NAIVE, a: sim.naive },
    { key: "humans", label: "Humans alone", color: C_HUM, a: sim.humans },
    { key: "rg", label: "Rogan–Gladen", color: C_RG, a: sim.rg },
    { key: "ppi", label: "PPI", color: C_PPI, a: sim.ppi },
  ] as const;

  /* ---- chart geometry (zoomed 36%–84% axis) ---- */
  const W = 540;
  const H = 250;
  const m = { l: 16, r: 52, t: 34, b: 34 };
  const D0 = 0.36;
  const D1 = 0.84;
  const x = scaler(D0, D1, m.l, W - m.r);
  const xc = (v: number) => x(Math.max(D0, Math.min(D1, v)));
  const innerH = H - m.t - m.b;
  const rowStep = innerH / rows.length;
  const ticks = [0.4, 0.5, 0.6, 0.7, 0.8];

  const effN = Math.round(sim.ppi.sumEffN / CAMPAIGNS);

  const covTile = (val: string, label: string, color: string) => (
    <div className="sim-stat">
      <div className="sim-stat-value" style={{ color }}>{val}</div>
      <div className="sim-stat-label">{label}</div>
    </div>
  );

  return (
    <SimFrame title="The PPI Playground — four estimators, one truth">
      <div className="sim-controls">
        <Slider label="True pass rate θ" value={theta} min={10} max={90} onChange={setTheta} display={`${theta}%`} />
        <Slider label="Judge TPR (sensitivity)" value={tpr} min={50} max={99} onChange={setTpr} display={`${tpr}%`} />
        <Slider label="Judge TNR (specificity)" value={tnr} min={50} max={99} onChange={setTnr} display={`${tnr}%`} />
        <Slider label="Human labels n" value={n} min={20} max={500} onChange={setN2} display={`${n}`} />
        <Slider label="Judge labels N" value={N} min={500} max={20000} step={500} onChange={setN} display={intFmt(N)} />
        <Btn onClick={() => setSeed((s) => s + 1)} primary>Resample</Btn>
      </div>

      <div className="sim-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} className="sim-chart" role="img" aria-label="four pass-rate estimators with point and 95% CI against the true theta">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={m.t} y2={H - m.b} stroke="var(--border)" strokeWidth={1} />
              <text x={x(t)} y={H - m.b + 16} textAnchor="middle" fontSize={11} fill="var(--muted)">{pct(t, 0)}</text>
            </g>
          ))}
          {/* true θ */}
          <line x1={x(thetaTrue)} x2={x(thetaTrue)} y1={m.t - 4} y2={H - m.b} stroke="var(--foreground)" strokeWidth={1.2} strokeDasharray="4 3" />
          <text x={x(thetaTrue)} y={m.t - 8} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--foreground)">true θ = {pct(thetaTrue, 0)}</text>

          {rows.map((r, i) => {
            const p = r.a.lastPoint;
            const half = r.a.sumHalf / CAMPAIGNS;
            const labelY = m.t + rowStep * i + 15;
            const barY = m.t + rowStep * i + 32;
            return (
              <g key={r.key}>
                <text x={m.l} y={labelY} fontSize={12} fontWeight={700} fill={r.color}>
                  {r.label} · avg CI ±{(half * 100).toFixed(1)}pp
                </text>
                <line x1={xc(p - half)} x2={xc(p + half)} y1={barY} y2={barY} stroke={r.color} strokeWidth={2.5} />
                <line x1={xc(p - half)} x2={xc(p - half)} y1={barY - 5} y2={barY + 5} stroke={r.color} strokeWidth={1.5} />
                <line x1={xc(p + half)} x2={xc(p + half)} y1={barY - 5} y2={barY + 5} stroke={r.color} strokeWidth={1.5} />
                <circle cx={xc(p)} cy={barY} r={4.5} fill={r.color} />
                <text x={xc(p + half) + 7} y={barY + 4} fontSize={12} fill={r.color} fontWeight={600}>{pct(p, 1)}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="sim-stats">
        {covTile(pct(sim.naive.covered / CAMPAIGNS, 0), "naive judge coverage (claims 95%)", C_NAIVE)}
        {covTile(pct(sim.humans.covered / CAMPAIGNS, 0), "humans-alone coverage", "var(--foreground)")}
        {covTile(pct(sim.rg.covered / CAMPAIGNS, 0), "Rogan–Gladen coverage", C_RG)}
      </div>
      <div className="sim-stats">
        {covTile(pct(sim.ppi.covered / CAMPAIGNS, 0), "PPI coverage", C_PPI)}
        {covTile(`n ≈ ${effN}`, "PPI ≈ humans-alone at N", C_PPI)}
      </div>

      <p className="sim-note">
        Each slider move reruns 300 simulated eval campaigns; bars show the last one, coverage counts all 300. The{" "}
        <strong style={{ color: C_NAIVE }}>naive judge</strong> bar is the narrowest and the most wrong — its tiny CI sits
        on the judge&rsquo;s biased rate, so it almost never covers θ. <strong style={{ color: C_HUM }}>Humans alone</strong>{" "}
        is honest but wide. <strong style={{ color: C_RG }}>Rogan–Gladen</strong> and{" "}
        <strong style={{ color: "var(--eb-accent)" }}>PPI</strong> both debias the judge and hold coverage near 95%; PPI&rsquo;s
        width floats between &ldquo;nearly the full N&rdquo; (a good judge) and &ldquo;your {n} humans&rdquo; (a useless one).
        Drop TNR to 70% and the naive bar strolls off the truth; push TPR and TNR to 99% and PPI&rsquo;s width collapses toward
        the judge-only bar.
      </p>
    </SimFrame>
  );
}
