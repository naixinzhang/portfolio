import React from "react";
import Sim from "@/components/sims/Sim";

/*
 * Splits a post's HTML on simulator markers of the form
 *   <div data-sim="sim-id"></div>
 * and interleaves the raw-HTML chunks with live React simulator components.
 */
export function renderContent(html: string): React.ReactNode {
  const parts = html.split(/<div data-sim="([^"]+)"><\/div>/);
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      if (parts[i].trim().length > 0) {
        nodes.push(
          <div key={`h${i}`} dangerouslySetInnerHTML={{ __html: parts[i] }} />
        );
      }
    } else {
      nodes.push(<Sim key={`s${i}`} id={parts[i]} />);
    }
  }
  return nodes;
}
