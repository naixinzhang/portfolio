"use client";

import React, { useMemo, useState } from "react";
import { SimFrame, Slider, Stat, Btn, pct, fmt, scaler, mulberry32, gaussian } from "./kit";

/* ---------------- constants ---------------- */

const N_TOTAL = 2000;
const N_TRAIN = 1000; // fit isotonic on these
const N_DISPLAY = 1000; // everything shown uses these (honest split)
const REL_BINS = 10;
const HIST_BINS = 30;

/* ---------------- pure helpers ---------------- */

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* Pool-Adjacent-Violators: exact isotonic (non-decreasing) fit of y. */
function pav(y: number[]): number[] {
  const blocks: { sum: number; w: number; val: number }[] = [];
  for (let i = 0; i < y.length; i++) {
    let b = { sum: y[i], w: 1, val: y[i] };
    while (blocks.length > 0 && blocks[blocks.length - 1].val >= b.val) {
      const last = blocks.pop()!;
      b = { sum: last.sum + b.sum, w: last.w + b.w, val: (last.sum + b.sum) / (last.w + b.w) };
    }
    blocks.push(b);
  }
  const out: number[] = [];
  for (const b of blocks) for (let i = 0; i < b.w; i++) out.push(b.val);
  return out;
}

/* AUROC via the rank / Mann–Whitney method (average ranks handle ties). */
function auroc(scores: number[], labels: number[]): number {
  const n = scores.length;
  const idx = scores.map((_, i) => i).sort((a, b) => scores[a] - scores[b]);
  const ranks = new Array<number>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n - 1 && scores[idx[j + 1]] === scores[idx[i]]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[idx[k]] = avg;
    i = j + 1;
  }
  let nPos = 0;
  let sumRankPos = 0;
  for (let k = 0; k < n; k++) {
    if (labels[k] === 1) {
      nPos++;
      sumRankPos += ranks[k];
    }
  }
  const nNeg = n - nPos;
  if (nPos === 0 || nNeg === 0) return 0.5;
  return (sumRankPos - (nPos * (nPos + 1)) / 2) / (nPos * nNeg);
}

interface RelPoint {
  x: number;
  y: number;
  n: number;
}

function reliability(preds: number[], labels: number[], bins: number): { points: RelPoint[]; ece: number } {
  const sumP = new Array<number>(bins).fill(0);
  const sumY = new Array<number>(bins).fill(0);
  const cnt = new Array<number>(bins).fill(0);
  for (let i = 0; i < preds.length; i++) {
    const b = Math.min(bins - 1, Math.floor(clamp(preds[i], 0, 1) * bins));
    sumP[b] += preds[i];
    sumY[b] += labels[i];
    cnt[b] += 1;
  }
  const points: RelPoint[] = [];
  let ece = 0;
  for (let b = 0; b < bins; b++) {
    if (cnt[b] === 0) continue;
    const x = sumP[b] / cnt[b];
    const y = sumY[b] / cnt[b];
    points.push({ x, y, n: cnt[b] });
    ece += (cnt[b] / preds.length) * Math.abs(x - y);
  }
  return { points, ece };
}

function histogram(values: number[], bins: number): number[] {
  const out = new Array<number>(bins).fill(0);
  for (const v of values) {
    const b = Math.min(bins - 1, Math.floor(clamp(v, 0, 1) * bins));
    out[b] += 1;
  }
  return out;
}

interface Metrics {
  precision: number;
  recall: number;
  alarm: number;
}

function metricsAt(scores: number[], labels: number[], tau: number): Metrics {
  let tp = 0;
  let predPos = 0;
  let pos = 0;
  for (let i = 0; i < scores.length; i++) {
    if (labels[i] === 1) pos++;
    if (scores[i] >= tau) {
      predPos++;
      if (labels[i] === 1) tp++;
    }
  }
  return { precision: predPos > 0 ? tp / predPos : NaN, recall: pos > 0 ? tp / pos : 0, alarm: predPos / scores.length };
}

const RAW = "#d64541";
const CAL = "var(--eb-accent)";
const PERFECT = "#2f8f4e";
const REL_TICKS = [
  { v: 0, t: "0" },
  { v: 0.25, t: ".25" },
  { v: 0.5, t: ".50" },
  { v: 0.75, t: ".75" },
  { v: 1, t: "1" },
];
const DEC_TICKS = [
  { v: 0, t: "0" },
  { v: 0.5, t: "0.5" },
  { v: 1, t: "1" },
];

/* ---------------- component ---------------- */

export default function CalibrationStudio() {
  const [seed, setSeed] = useState(1);
  const [calOn, setCalOn] = useState(true);
  const [tau, setTau] = useState(0.5);

  const model = useMemo(() => {
    const rand = mulberry32(seed);
    interface Item {
      p: number;
      label: number;
      s: number;
      cal: number;
    }
    const items: Item[] = [];
    for (let i = 0; i < N_TOTAL; i++) {
      const p = rand();
      const label = rand() < p ? 1 : 0;
      const s = clamp(0.04 + 0.32 * p + gaussian(rand, 0, 0.1), 0, 1);
      items.push({ p, label, s, cal: 0 });
    }
    const train = items.slice(0, N_TRAIN);
    const display = items.slice(N_TRAIN, N_TRAIN + N_DISPLAY);
    const trainSorted = [...train].sort((a, b) => a.s - b.s);
    const fitted = pav(trainSorted.map((t) => t.label));
    const grid = trainSorted.map((t) => t.s);
    const calibrate = (x: number): number => {
      if (x <= grid[0]) return fitted[0];
      if (x >= grid[grid.length - 1]) return fitted[fitted.length - 1];
      let lo = 0;
      let hi = grid.length - 1;
      let ans = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (grid[mid] <= x) {
          ans = mid;
          lo = mid + 1;
        } else hi = mid - 1;
      }
      return fitted[ans];
    };
    for (const d of display) d.cal = calibrate(d.s);
    const rawScores = display.map((d) => d.s);
    const calScores = display.map((d) => d.cal);
    const labels = display.map((d) => d.label);
    const auc = auroc(rawScores, labels);
    const relRaw = reliability(rawScores, labels, REL_BINS);
    const relCal = reliability(calScores, labels, REL_BINS);
    const histRaw = histogram(rawScores, HIST_BINS);
    const histCal = histogram(calScores, HIST_BINS);
    const maxHist = Math.max(1, ...histRaw, ...histCal);
    return { rawScores, calScores, labels, auc, relRaw, relCal, histRaw, histCal, maxHist };
  }, [seed]);

  const beforeM = metricsAt(model.rawScores, model.labels, tau);
  const afterM = metricsAt(model.calScores, model.labels, tau);
  const showPct = (x: number) => (Number.isNaN(x) ? "—" : pct(x));

  /* reliability geometry */
  const RW = 360;
  const RH = 268;
  const rm = { l: 40, r: 14, t: 16, b: 40 };
  const rx = scaler(0, 1, rm.l, RW - rm.r);
  const ry = scaler(0, 1, RH - rm.b, rm.t);

  /* decision geometry */
  const DW = 360;
  const DH = 240;
  const dm = { l: 28, r: 14, t: 16, b: 38 };
  const dx = scaler(0, 1, dm.l, DW - dm.r);
  const dyTop = dm.t;
  const dyBot = DH - dm.b;
  const barW = (dx(1) - dx(0)) / HIST_BINS;
  const barH = (c: number) => ((dyBot - dyTop) * c) / model.maxHist;

  return (
    <SimFrame title="The Calibration Studio">
      <div className="sim-aurocbox">
        <span className="sim-auroc-big">
          AUROC: {fmt(model.auc, 2)} → {fmt(model.auc, 2)}
        </span>
        <span className="sim-auroc-sub">ranking untouched; decisions transformed</span>
      </div>

      <div className="sim-controls">
        <Btn onClick={() => setCalOn((v) => !v)} primary={calOn}>
          Apply isotonic calibration
        </Btn>
        <Slider
          label="Decision threshold τ"
          value={tau}
          min={0}
          max={1}
          step={0.01}
          onChange={setTau}
          display={fmt(tau, 2)}
        />
        <Btn onClick={() => setSeed((s) => s + 1)}>Resample data</Btn>
      </div>

      <div className="sim-2col">
        {/* ---- reliability diagram ---- */}
        <div>
          <p className="sim-sectlabel">Reliability diagram</p>
          <div className="sim-scroll">
            <svg viewBox={`0 0 ${RW} ${RH}`} className="sim-chart" role="img" aria-label="reliability diagram: observed positive rate versus mean predicted probability">
              {REL_TICKS.map((g) => (
                <g key={`ry${g.v}`}>
                  <line x1={rm.l} x2={RW - rm.r} y1={ry(g.v)} y2={ry(g.v)} stroke="var(--border)" strokeWidth={1} />
                  <text x={rm.l - 6} y={ry(g.v) + 3} textAnchor="end" fontSize={11}>{g.t}</text>
                </g>
              ))}
              {REL_TICKS.map((g) => (
                <text key={`rx${g.v}`} x={rx(g.v)} y={RH - rm.b + 16} textAnchor="middle" fontSize={11}>{g.t}</text>
              ))}
              <text x={(rm.l + RW - rm.r) / 2} y={RH - 4} textAnchor="middle" fontSize={11}>mean predicted probability</text>
              <text x={12} y={(rm.t + RH - rm.b) / 2} textAnchor="middle" fontSize={11} transform={`rotate(-90 12 ${(rm.t + RH - rm.b) / 2})`}>observed positive rate</text>
              <line x1={rx(0)} y1={ry(0)} x2={rx(1)} y2={ry(1)} stroke={PERFECT} strokeWidth={1.3} strokeDasharray="4 4" />
              {calOn && model.relCal.points.map((p, i) => <circle key={`rc${i}`} cx={rx(p.x)} cy={ry(p.y)} r={5} fill={CAL} />)}
              {model.relRaw.points.map((p, i) => <circle key={`rr${i}`} cx={rx(p.x)} cy={ry(p.y)} r={5.5} fill={RAW} />)}
              <text x={rx(0.4)} y={ry(0.97)} fontSize={11} fontWeight={700} fill={RAW}>raw scores (held-out half)</text>
            </svg>
          </div>
          <div className="sim-stats">
            <Stat label="ECE · raw scores" value={fmt(model.relRaw.ece, 3)} tone="warn" />
            <Stat label="ECE · calibrated" value={fmt(model.relCal.ece, 3)} tone="accent" />
          </div>
        </div>

        {/* ---- decision view ---- */}
        <div>
          <p className="sim-sectlabel">Decision view at τ</p>
          <div className="sim-scroll">
            <svg viewBox={`0 0 ${DW} ${DH}`} className="sim-chart" role="img" aria-label="overlaid raw and calibrated score histograms with the decision threshold">
              {DEC_TICKS.map((g) => (
                <text key={`dx${g.v}`} x={dx(g.v)} y={DH - dm.b + 16} textAnchor="middle" fontSize={11}>{g.t}</text>
              ))}
              <line x1={dm.l} x2={DW - dm.r} y1={dyBot} y2={dyBot} stroke="var(--border)" strokeWidth={1} />
              {model.histRaw.map((c, i) => (c > 0 ? <rect key={`hr${i}`} x={dx(i / HIST_BINS)} y={dyBot - barH(c)} width={Math.max(1, barW - 0.5)} height={barH(c)} fill={RAW} fillOpacity={0.6} /> : null))}
              {calOn && model.histCal.map((c, i) => (c > 0 ? <rect key={`hc${i}`} x={dx(i / HIST_BINS)} y={dyBot - barH(c)} width={Math.max(1, barW - 0.5)} height={barH(c)} fill={CAL} fillOpacity={0.5} /> : null))}
              <line x1={dx(tau)} x2={dx(tau)} y1={dyTop} y2={dyBot} stroke="var(--foreground)" strokeWidth={1.3} strokeDasharray="4 3" />
              <text x={dx(tau) + 4} y={dyTop + 10} fontSize={11} fontWeight={700} fill="var(--foreground)">τ = {fmt(tau, 2)}</text>
            </svg>
          </div>
          <p className="sim-note" style={{ textAlign: "center", marginTop: 2 }}>
            score distributions — <span style={{ color: RAW }}>red: raw</span>, <span style={{ color: CAL }}>blue: calibrated</span>
          </p>
          <div className="sim-stats">
            <Stat label="precision · before" value={showPct(beforeM.precision)} tone="warn" />
            <Stat label="recall · before" value={showPct(beforeM.recall)} tone="warn" />
            <Stat label="alarm · before" value={showPct(beforeM.alarm)} tone="warn" />
          </div>
          <div className="sim-stats">
            <Stat label="precision · after" value={showPct(afterM.precision)} tone="accent" />
            <Stat label="recall · after" value={showPct(afterM.recall)} tone="accent" />
            <Stat label="alarm · after" value={showPct(afterM.alarm)} tone="accent" />
          </div>
        </div>
      </div>

      <p className="sim-callout">
        A threshold of {fmt(tau, 2)} selects {pct(beforeM.alarm)} of items before calibration — {pct(afterM.alarm)} after.
      </p>

      <p className="sim-note" style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <span><span style={{ color: RAW, fontWeight: 700 }}>■</span> raw (compressed) scores</span>
        <span><span style={{ color: CAL, fontWeight: 700 }}>■</span> after isotonic calibration</span>
        <span><span style={{ color: PERFECT, fontWeight: 700 }}>■</span> perfect calibration</span>
      </p>

      <p className="sim-note">
        2,000 synthetic items: each gets a true probability p, a label drawn from p, and a model score = 0.04 + 0.32·p +
        noise — ranks preserved, values squashed into the bottom of [0,1]. The isotonic map (pool-adjacent-violators, exact)
        is fit on 1,000 items and everything shown is the other 1,000 — an honest train/display split. Isotonic is monotone,
        so AUROC is identical before and after: that is the whole punchline.
      </p>
    </SimFrame>
  );
}
