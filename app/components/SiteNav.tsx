"use client";

import { useState } from "react";
import Link from "next/link";
import { studentHousingHref } from "../../lib/site-data";

export type SiteSection = "residences" | "neighbourhoods" | "approach" | "contact" | "student-housing" | "inventory";

const links: { href: string; label: string; section: SiteSection }[] = [
  { href: "/residences", label: "Residences", section: "residences" },
  { href: "/neighbourhoods", label: "Neighbourhoods", section: "neighbourhoods" },
  { href: "/approach", label: "Our approach", section: "approach" },
  { href: "/inventory", label: "Inventory", section: "inventory" },
  { href: studentHousingHref, label: "Find by university", section: "student-housing" },
];

export default function SiteNav({ current }: { current?: SiteSection }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-nav">
      <Link className="brand" href="/" aria-label="REMARCABLE LIVING home" onClick={() => setOpen(false)}><span className="brand-mark">R</span><span>REMARCABLE LIVING</span></Link>
      <button className="site-nav-menu" type="button" aria-expanded={open} aria-controls="site-links" onClick={() => setOpen(!open)}>{open ? "Close" : "Menu"}</button>
      <nav id="site-links" className={open ? "is-open" : ""} aria-label="Primary navigation">
        {links.map((link) => <Link key={link.href} href={link.href} aria-current={current === link.section ? "page" : undefined} onClick={() => setOpen(false)}>{link.label}</Link>)}
        <Link className="site-nav-mobile-contact" href="/contact" aria-current={current === "contact" ? "page" : undefined} onClick={() => setOpen(false)}>Talk to Mark</Link>
      </nav>
      <Link className="site-nav-contact" href="/contact" aria-current={current === "contact" ? "page" : undefined}>Talk to Mark</Link>
    </header>
  );
}
