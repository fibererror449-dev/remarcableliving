import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const siteOrigin = "https://www.remarcableliving.co";
const siteTitle = "REMARCABLE LIVING — Bangkok condominium assistance";
const siteDescription = "Find a Bangkok condominium with realistic prices, neighbourhood guidance, and personal rental assistance.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
