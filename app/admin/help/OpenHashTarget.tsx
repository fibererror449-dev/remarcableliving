"use client";
import { useEffect } from "react";

/** Opens the guide a contents link points at, on arrival, on click and on Back/Forward. */
export default function OpenHashTarget() {
  useEffect(() => {
    const open = (hash: string) => {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target instanceof HTMLDetailsElement) target.open = true;
    };
    const click = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      if (link) open(link.hash);
    };
    const change = () => open(location.hash);
    change();
    document.addEventListener("click", click);
    window.addEventListener("hashchange", change);
    return () => { document.removeEventListener("click", click); window.removeEventListener("hashchange", change); };
  }, []);
  return null;
}
