"use client";

import React from "react";
import PasskExplorer from "./PasskExplorer";
import ErrorBarSimulator from "./ErrorBarSimulator";
import SampleSizeSimulator from "./SampleSizeSimulator";
import RaterAgreementBench from "./RaterAgreementBench";
import PpiPlayground from "./PpiPlayground";
import BradleyTerrySandbox from "./BradleyTerrySandbox";
import CalibrationStudio from "./CalibrationStudio";

const REGISTRY: Record<string, React.ComponentType> = {
  "passk-explorer": PasskExplorer,
  "error-bar-simulator": ErrorBarSimulator,
  "sample-size-simulator": SampleSizeSimulator,
  "rater-agreement-bench": RaterAgreementBench,
  "ppi-playground": PpiPlayground,
  "bradley-terry-sandbox": BradleyTerrySandbox,
  "calibration-studio": CalibrationStudio,
};

export default function Sim({ id }: { id: string }) {
  const Component = REGISTRY[id];
  if (!Component) {
    return (
      <div className="sim-frame">
        <p className="sim-frame-title">Simulator</p>
        <p className="sim-note">Interactive demo &ldquo;{id}&rdquo; not found.</p>
      </div>
    );
  }
  return <Component />;
}
