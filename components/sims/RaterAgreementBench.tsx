"use client";

import React, { useMemo, useState } from "react";
import { SimFrame, Slider, Stat, Tabs, pct, fmt, scaler } from "./kit";

export default function RaterAgreementBench() {
  const [tab, setTab] = useState(0);
  return (
    <SimFrame title="The Rater-Agreement Bench">
      <Tabs
        tabs={["The prevalence paradox", "Read the disagreements"]}
        active={tab}
        onChange={setTab}
      />
      {tab === 0 ? <PrevalenceParadox /> : <ReadTheDisagreements />}
    </SimFrame>
  );
}

/* ---------------- Tab 1 — analytic, no RNG ---------------- */

function landisKoch(k: number): { label: string; tone: string } {
  if (k < 0) return { label: "poor", tone: "#d64541" };
  if (k < 0.2) return { label: "slight", tone: "#d64541" };
  if (k < 0.4) return { label: "fair", tone: "#c9821f" };
  if (k < 0.6) return { label: "moderate", tone: "#c9821f" };
  if (k < 0.8) return { label: "substantial", tone: "#2f8f4e" };
  return { label: "almost perfect", tone: "#2f8f4e" };
}

function PrevalenceParadox() {
  const [prevPct, setPrevPct] = useState(90);
  const [accAPct, setAccAPct] = useState(93);
  const [accBPct, setAccBPct] = useState(93);

  const model = useMemo(() => {
    const prev = prevPct / 100;
    const aA = accAPct / 100;
    const aB = accBPct / 100;

    // joint cells of A-label × B-label, errors independent given the truth
    const PP = prev * aA * aB + (1 - prev) * (1 - aA) * (1 - aB);
    const PF = prev * aA * (1 - aB) + (1 - prev) * (1 - aA) * aB;
    const FP = prev * (1 - aA) * aB + (1 - prev) * aA * (1 - aB);
    const FF = prev * (1 - aA) * (1 - aB) + (1 - prev) * aA * aB;

    const aPass = PP + PF; // P(A = pass)
    const bPass = PP + FP; // P(B = pass)
    const aFail = 1 - aPass;
    const bFail = 1 - bPass;

    const po = PP + FF;
    const pe = aPass * bPass + aFail * bFail;
    const kappa = pe < 1 ? (po - pe) / (1 - pe) : 1;

    return { PP, PF, FP, FF, aPass, bPass, aFail, bFail, po, pe, kappa };
  }, [prevPct, accAPct, accBPct]);

  const lk = landisKoch(model.kappa);
  const c = (x: number) => x * 100; // counts per 100 items

  // two-bar chart
  const W = 540;
  const H = 150;
  const m = { l: 130, r: 70, t: 18, b: 20 };
  const x = scaler(0, 1, m.l, W - m.r);
  const kappaBar = Math.max(0, Math.min(1, model.kappa));

  return (
    <>
      <div className="sim-controls">
        <Slider
          label="True prevalence of pass (%)"
          value={prevPct}
          min={5}
          max={95}
          onChange={setPrevPct}
          display={`${prevPct}%`}
        />
        <Slider
          label="Rater A accuracy (%)"
          value={accAPct}
          min={50}
          max={99}
          onChange={setAccAPct}
          display={`${accAPct}%`}
        />
        <Slider
          label="Rater B accuracy (%)"
          value={accBPct}
          min={50}
          max={99}
          onChange={setAccBPct}
          display={`${accBPct}%`}
        />
      </div>

      <div className="sim-stats">
        <Stat label="raw agreement p₀" value={pct(model.po)} sub="both agree" tone="warn" />
        <Stat label="Cohen's κ" value={fmt(model.kappa, 2)} sub={lk.label} tone="accent" />
        <Stat label="chance agreement pₑ" value={pct(model.pe)} sub="expected if independent" tone="muted" />
      </div>

      <div className="sim-scroll">
        <table className="not-prose" style={{ borderCollapse: "collapse", margin: "0.5rem 0", fontSize: 13, minWidth: 380 }}>
          <thead>
            <tr>
              <th style={cellTh}></th>
              <th style={cellTh}>B says pass</th>
              <th style={cellTh}>B says fail</th>
              <th style={{ ...cellTh, color: "var(--muted)" }}>A total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th style={cellTh}>A says pass</th>
              <td style={cellDiag}>{fmt(c(model.PP), 1)}</td>
              <td style={cellTd}>{fmt(c(model.PF), 1)}</td>
              <td style={cellTotal}>{fmt(c(model.aPass), 1)}</td>
            </tr>
            <tr>
              <th style={cellTh}>A says fail</th>
              <td style={cellTd}>{fmt(c(model.FP), 1)}</td>
              <td style={cellDiag}>{fmt(c(model.FF), 1)}</td>
              <td style={cellTotal}>{fmt(c(model.aFail), 1)}</td>
            </tr>
            <tr>
              <th style={{ ...cellTh, color: "var(--muted)" }}>B total</th>
              <td style={cellTotal}>{fmt(c(model.bPass), 1)}</td>
              <td style={cellTotal}>{fmt(c(model.bFail), 1)}</td>
              <td style={cellTotal}>100</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="sim-scroll">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="sim-chart"
          role="img"
          aria-label="raw agreement versus chance-corrected kappa on a 0 to 1 scale"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <g key={g}>
              <line x1={x(g)} x2={x(g)} y1={m.t} y2={H - m.b} stroke="var(--border)" strokeWidth={1} />
              <text x={x(g)} y={H - m.b + 14} textAnchor="middle" fontSize={10}>
                {pct(g, 0)}
              </text>
            </g>
          ))}

          {/* raw agreement bar */}
          <text x={m.l - 8} y={m.t + 22} textAnchor="end" fontSize={11} fill="#c9821f" fontWeight={600}>
            raw agreement
          </text>
          <rect x={x(0)} y={m.t + 8} width={x(model.po) - x(0)} height={22} fill="#c9821f" rx={2} />
          <text x={x(model.po) + 6} y={m.t + 23} fontSize={11} fill="#c9821f" fontWeight={600}>
            {pct(model.po, 0)}
          </text>

          {/* kappa bar */}
          <text x={m.l - 8} y={m.t + 68} textAnchor="end" fontSize={11} fill="var(--eb-accent)" fontWeight={600}>
            Cohen&rsquo;s κ
          </text>
          <rect x={x(0)} y={m.t + 54} width={x(kappaBar) - x(0)} height={22} fill="var(--eb-accent)" rx={2} />
          <text x={x(kappaBar) + 6} y={m.t + 69} fontSize={11} fill="var(--eb-accent)" fontWeight={600}>
            {fmt(model.kappa, 2)}
          </text>

          <text x={m.l - 8} y={m.t + 40} textAnchor="end" fontSize={9} fill="var(--muted)">
            the flattering number
          </text>
          <text x={m.l - 8} y={m.t + 86} textAnchor="end" fontSize={9} fill="var(--muted)">
            chance-corrected
          </text>
        </svg>
      </div>

      <div className="sim-stats">
        <Stat label="Landis–Koch band" value={lk.label} tone="muted" />
      </div>

      <p className="sim-note">
        Raw agreement is <em>the flattering number</em>; κ is chance-corrected. With equal per-class accuracy,
        dragging <strong>prevalence</strong> leaves raw agreement p₀ unchanged while κ moves — because the chance
        floor pₑ rises with skew, and κ pays for it. Two raters can agree {pct(model.po, 0)} of the time and still
        be only <strong>{lk.label}</strong> once you subtract the agreement you&rsquo;d expect by luck.
      </p>
    </>
  );
}

const cellTh: React.CSSProperties = {
  padding: "6px 12px",
  textAlign: "center",
  fontWeight: 600,
  border: "1px solid var(--border)",
  whiteSpace: "nowrap",
};
const cellTd: React.CSSProperties = {
  padding: "6px 12px",
  textAlign: "center",
  border: "1px solid var(--border)",
};
const cellDiag: React.CSSProperties = {
  ...cellTd,
  fontWeight: 700,
  background: "color-mix(in srgb, var(--eb-accent) 12%, transparent)",
};
const cellTotal: React.CSSProperties = {
  ...cellTd,
  color: "var(--muted)",
};

/* ---------------- Tab 2 — case cards, no RNG ---------------- */

type Triage = "ambiguous rubric" | "genuinely hard" | "rater error";

interface RaterCase {
  domain: string;
  scenario: string;
  a: "pass" | "fail";
  b: "pass" | "fail";
  tag: Triage;
  fix: string;
}

const CASES: RaterCase[] = [
  {
    domain: "SUMMARIZATION",
    scenario: "Clean, fluent summary. The source says Q2, the summary says Q3.",
    a: "pass",
    b: "fail",
    tag: "rater error",
    fix: "A missed a factual error a competent rater would catch.",
  },
  {
    domain: "CUSTOMER SUPPORT",
    scenario: "Resolves the issue in three correct sentences. No greeting, borderline curt.",
    a: "fail",
    b: "pass",
    tag: "ambiguous rubric",
    fix: "The rubric never says whether tone counts.",
  },
  {
    domain: "SAFETY BOUNDARY",
    scenario:
      "'Can I take ibuprofen with my BP meds?' Model gives general interaction info + firm see-your-doctor.",
    a: "pass",
    b: "fail",
    tag: "ambiguous rubric",
    fix: "How much medical detail is 'too much' is undefined.",
  },
  {
    domain: "CODING TASK",
    scenario: "Passes all provided tests — by hardcoding the sample edge case in an if branch.",
    a: "pass",
    b: "fail",
    tag: "genuinely hard",
    fix: "Detecting reward-hacking needs held-out tests, not opinion.",
  },
  {
    domain: "RESEARCH ASSISTANT",
    scenario: "Citation is real and perfectly formatted — but the DOI resolves to a different paper.",
    a: "pass",
    b: "fail",
    tag: "ambiguous rubric",
    fix: "The rubric doesn't require raters to resolve every DOI.",
  },
  {
    domain: "Q&A",
    scenario: "Thorough, correct answer that buries the direct 'yes' under four paragraphs of caveats.",
    a: "pass",
    b: "fail",
    tag: "ambiguous rubric",
    fix: "Correct-but-unhelpful has no defined verdict.",
  },
  {
    domain: "TRANSLATION",
    scenario: "Meaning preserved exactly; register slides from formal business prose to casual.",
    a: "fail",
    b: "pass",
    tag: "ambiguous rubric",
    fix: "Whether register is in scope was never specified.",
  },
  {
    domain: "EXTRACTION",
    scenario: "Every field correct — delivered as a markdown table instead of the requested JSON.",
    a: "fail",
    b: "pass",
    tag: "ambiguous rubric",
    fix: "Format-vs-content weighting is left to the rater.",
  },
];

const TRIAGE_TONE: Record<Triage, string> = {
  "ambiguous rubric": "#c9821f",
  "genuinely hard": "var(--eb-accent)",
  "rater error": "#d64541",
};

const LEGEND: { tag: Triage; fix: string }[] = [
  { tag: "ambiguous rubric", fix: "fix the instrument" },
  { tag: "genuinely hard", fix: "gold sets & requalification" },
  { tag: "rater error", fix: "gold sets + requalification, retire raters who miss them" },
];

function verdictColor(v: "pass" | "fail"): string {
  return v === "pass" ? "#2f8f4e" : "#d64541";
}

function ReadTheDisagreements() {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <>
      <p className="sim-note" style={{ marginTop: 0 }}>
        Eight items where Rater A and Rater B split. Click a card to reveal which bin the disagreement
        belongs in — and the fix that bin demands.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 12,
          margin: "0.75rem 0",
        }}
      >
        {CASES.map((cs, i) => {
          const open = revealed.has(i);
          return (
            <button
              key={cs.domain}
              type="button"
              onClick={() => toggle(i)}
              style={{
                textAlign: "left",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "12px 14px",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                color: "inherit",
                font: "inherit",
              }}
              aria-expanded={open}
            >
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                  color: "var(--muted)",
                }}
              >
                {cs.domain}
              </span>
              <span style={{ fontSize: 13, lineHeight: 1.4 }}>{cs.scenario}</span>
              <span style={{ display: "flex", gap: 12, fontSize: 12, fontWeight: 600 }}>
                <span>
                  A:{" "}
                  <span style={{ color: verdictColor(cs.a) }}>{cs.a}</span>
                </span>
                <span>
                  B:{" "}
                  <span style={{ color: verdictColor(cs.b) }}>{cs.b}</span>
                </span>
              </span>

              {open ? (
                <span
                  style={{
                    marginTop: 2,
                    paddingTop: 8,
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      alignSelf: "flex-start",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      padding: "2px 8px",
                      borderRadius: 999,
                      color: TRIAGE_TONE[cs.tag],
                      border: `1px solid ${TRIAGE_TONE[cs.tag]}`,
                    }}
                  >
                    {cs.tag}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>{cs.fix}</span>
                </span>
              ) : (
                <span style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>
                  click to triage
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "10px 14px",
          margin: "0.5rem 0",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {LEGEND.map((l) => (
          <div key={l.tag} style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: 12 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: TRIAGE_TONE[l.tag],
                minWidth: 130,
              }}
            >
              {l.tag}
            </span>
            <span style={{ color: "var(--muted)" }}>→ {l.fix}</span>
          </div>
        ))}
      </div>

      <p className="sim-note">
        Most rater splits are not two people being careless — they are the <em>rubric</em> failing to decide a
        genuinely contested case. The habit that pays off is asking, every time,{" "}
        <strong>&ldquo;which bin is this?&rdquo;</strong> before you blame a rater.
      </p>
    </>
  );
}
