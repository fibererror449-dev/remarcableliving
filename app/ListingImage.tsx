"use client";

import { useState } from "react";
import "./listing-image.css";

/** Missing listing photography must not be replaced with an invented room. */
export default function ListingImage({ src, alt }: { src: string; alt: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (failedSource === src) return (
    <div className="listing-photo-fallback" role="img" aria-label={`Photo unavailable: ${alt}`}>
      <p>Photo being updated<small>Ask Mark for current photos.</small></p>
    </div>
  );
  return <img src={src} alt={alt} onError={() => setFailedSource(src)} />;
}
