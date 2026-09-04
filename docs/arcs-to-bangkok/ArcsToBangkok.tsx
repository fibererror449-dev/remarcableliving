"use client";

import { useEffect, useRef } from "react";
import { mountArcs } from "./arcs-to-bangkok";

/**
 * Drop-in section: a world map whose arcs fly from 38 origin cities to Bangkok.
 *
 *   <ArcsToBangkok />
 *
 * The wrapper must have a height — the canvas fills it. Nothing else is needed.
 */
export default function ArcsToBangkok({
  height = "70vh",
  background = "#0B161E",
}: {
  height?: string;
  background?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handle = mountArcs(ref.current);
    return () => handle.destroy();
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height, background }}>
      <canvas
        ref={ref}
        style={{ display: "block", width: "100%", height: "100%" }}
        role="img"
        aria-label="World map with flight paths from 38 cities converging on Bangkok, Thailand."
      />
    </div>
  );
}
