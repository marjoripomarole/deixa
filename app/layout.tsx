import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://deixa.app"),
  applicationName: "Deixa",
  title: "Deixa – Memorize suas falas",
  description: "Seu parceiro de cena para praticar roteiros, ouvir deixas e memorizar falas com voz em português brasileiro.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Deixa – Memorize suas falas",
    description: "Pratique roteiros, ouça deixas e memorize falas com voz em português brasileiro.",
    url: "https://deixa.app",
    siteName: "Deixa",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
