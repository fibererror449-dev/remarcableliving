import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const siteOrigin = "https://www.remarcableliving.co";
const siteTitle = "REMARCABLE LIVING — Bangkok condominium assistance";
const siteDescription = "Find a Bangkok condominium with realistic prices, neighbourhood guidance, and personal rental assistance.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: siteTitle,
  description: siteDescription,
  alternates: { canonical: siteOrigin },
  openGraph: {
    type: "website",
    url: siteOrigin,
    siteName: "REMARCABLE LIVING",
    title: siteTitle,
    description: siteDescription,
    images: [{
      url: "/og.png",
      width: 1200,
      height: 630,
      alt: "REMARCABLE LIVING — Mark your place. Find your space.",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
