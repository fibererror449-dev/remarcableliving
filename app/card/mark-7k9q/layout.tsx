import type { Metadata, Viewport } from "next";
import { businessCard } from "../../../lib/business-card";
import "./card.css";

export const metadata: Metadata = {
  title: "Mark Kunthwakhumlue | REMARCABLE LIVING",
  description: "Founder, REMARCABLE LIVING. Mark your place. Find your space.",
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: businessCard.path },
  appleWebApp: { capable: true, title: "Mark's card", statusBarStyle: "black" },
  icons: { apple: "/business-card/apple-touch-icon.png" },
  manifest: "/business-card/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#11110f" };

export default function CardLayout({ children }: { children: React.ReactNode }) {
  return <div className="business-card-shell">{children}</div>;
}
