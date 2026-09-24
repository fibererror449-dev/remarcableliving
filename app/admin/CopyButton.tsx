"use client";
import { useEffect, useState, type ReactNode } from "react";

/** Copies the text of the element with id `target`, so what is copied is exactly what is shown. */
export default function CopyButton({ target, label, children = "Copy" }: { target: string; label: string; children?: ReactNode }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  useEffect(() => {
    if (state !== "copied") return;
    const timer = setTimeout(() => setState("idle"), 4000);
    return () => clearTimeout(timer);
  }, [state]);
  async function copy() {
    const element = document.getElementById(target);
    if (!element) return;
    try { await navigator.clipboard.writeText(element.textContent ?? ""); setState("copied"); }
    catch {
      // Clipboard blocked: select the text instead so the admin can copy it by hand.
      element.closest("details")?.setAttribute("open", "");
      const range = document.createRange(); range.selectNodeContents(element);
      const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
      setState("manual");
    }
  }
  return <span className="help-copy">
    <button type="button" onClick={copy} aria-label={label}>{state === "copied" ? "Copied ✓" : children}</button>
    <span role="status">{state === "copied" ? "Copied. Paste it into your AI assistant." : state === "manual" ? "Text selected. Press Ctrl+C (⌘C on Mac) to copy." : ""}</span>
  </span>;
}
