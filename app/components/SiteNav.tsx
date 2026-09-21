"use client";

import { useState } from "react";
import BrandLogo from "./BrandLogo";
import { studentHousingHref } from "../../lib/site-data";

export type SiteSection = "residences" | "neighbourhoods" | "about" | "contact" | "student-housing" | "inventory";

const links: { href: string; label: string; section?: SiteSection }[] = [
  { href: studentHousingHref, label: "Your University", section: "student-housing" },
  { href: "/residences", label: "Condo/Apartment", section: "residences" },
  { href: "/neighbourhoods", label: "Neighbourhoods", section: "neighbourhoods" },
  { href: "/neighbourhoods#guide", label: "Bangkok guide" },
  { href: "/about", label: "About Us", section: "about" },
];

export default function SiteNav({ current }: { current?: SiteSection }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-nav">
      <a className="brand" href="/" aria-label="REMARCABLE LIVING home" onClick={() => setOpen(false)}><BrandLogo /></a>
      <button className="site-nav-menu" type="button" aria-expanded={open} aria-controls="site-links" onClick={() => setOpen(!open)}>{open ? "Close" : "Menu"}</button>
      <nav id="site-links" className={open ? "is-open" : ""} aria-label="Primary navigation">
        {links.map((link) => <a key={link.href} href={link.href} aria-current={link.section && current === link.section ? "page" : undefined} onClick={() => setOpen(false)}>{link.label}</a>)}
        <a className="site-nav-mobile-contact" href="/contact" aria-current={current === "contact" ? "page" : undefined} onClick={() => setOpen(false)}>Mark your place, Find your space.</a>
      </nav>
      <a className="site-nav-contact" href="/contact" aria-current={current === "contact" ? "page" : undefined}>Mark your place, Find your space.</a>
    </header>
  );
}
