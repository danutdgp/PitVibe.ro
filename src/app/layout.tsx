import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import { PwaManager } from "@/components/pwa-manager";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "PitVibe.ro — Piteștiul, mai aproape", template: "%s | PitVibe.ro" },
  description: "Comunitatea locală în care descoperi oameni, povești și ieșiri din Pitești.",
  applicationName: "PitVibe.ro",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "PitVibe.ro" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#0a0811", colorScheme: "dark" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="ro" data-scroll-behavior="smooth" className={`${geist.variable} antialiased`}><body><PwaManager />{children}<SiteFooter /></body></html>;
}
