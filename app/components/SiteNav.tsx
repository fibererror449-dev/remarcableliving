"use client";

import { useState } from "react";
import Link from "next/link";

export const universityUrl = "https://www.remarcableliving.co/student-housing";

export default function SiteNav({ current }: { current?: "inventory" }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-nav">
      <Link className="brand" href="/" aria-label="REMARCABLE LIVING home" onClick={() => setOpen(false)}><span className="brand-mark">R</span><span>REMARCABLE LIVING</span></Link>
      <button className="site-nav-menu" type="button" aria-expanded={open} aria-controls="site-links" onClick={() => setOpen(!open)}>{open ? "Close" : "Menu"}</button>
      <nav id="site-links" className={open ? "is-open" : ""} aria-label="Primary navigation">
        <Link href="/#residences" onClick={() => setOpen(false)}>Residences</Link>
        <Link href="/#neighbourhoods" onClick={() => setOpen(false)}>Neighbourhoods</Link>
        <Link href="/inventory" aria-current={current === "inventory" ? "page" : undefined} onClick={() => setOpen(false)}>Inventory</Link>
        <a href={universityUrl}>Find by university</a>
        <Link className="site-nav-mobile-contact" href="/#assist" onClick={() => setOpen(false)}>Talk to Mark</Link>
      </nav>
      <Link className="site-nav-contact" href="/#assist">Talk to Mark</Link>
    </header>
  );
}
