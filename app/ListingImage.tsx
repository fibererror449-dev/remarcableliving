"use client";

import { useEffect, useRef, useState } from "react";
import "./listing-image.css";

/** Missing listing photography must not be replaced with an invented room. */
export default function ListingImage({ src, alt }: { src: string; alt: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // A server-rendered image can fail before hydration, so its error event
    // never reaches React. Check the settled state once on mount.
    const node = image.current;
    if (node && node.complete && node.naturalWidth === 0) setFailedSource(src);
  }, [src]);
  if (failedSource === src) return (
    <div className="listing-photo-fallback" role="img" aria-label={`Photo unavailable: ${alt}`}>
      <p>Photo being updated<small>Ask Mark for current photos.</small></p>
    </div>
  );
  return <img ref={image} src={src} alt={alt} onError={() => setFailedSource(src)} />;
}
