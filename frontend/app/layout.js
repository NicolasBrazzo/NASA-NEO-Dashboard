import { Geist, IBM_Plex_Mono, Fraunces, Bricolage_Grotesque } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Font monospace: IBM Plex Mono — heritage ingegneristico, porta l'identità
// "strumento di misura" su dati, numeri tabellari, eyebrow e meta-testo.
const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

// Font dei titoli: grottesco contemporaneo con optical sizing (asse opsz),
// così resta nitido sia nei titoloni hero che nelle dimensioni più piccole.
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const description =
  "Il Centro di Studi degli Oggetti Vicini alla Terra della NASA traccia ogni asteroide che passa nel vicinato del Sistema Solare. I dati sono pubblici, aggiornati quotidianamente, e accessibili via API. La stessa API che usano i ricercatori veri.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  // Il template viene applicato ai titoli definiti nelle pagine figlie:
  // es. "Statistiche" → "Statistiche · NASA NEO Dashboard".
  title: {
    default: "NASA NEO Dashboard — Asteroidi vicini alla Terra",
    template: `%s · ${SITE_NAME}`,
  },
  description,
  applicationName: SITE_NAME,
  keywords: [
    "NASA",
    "NEO",
    "asteroidi",
    "near-earth objects",
    "avvicinamenti",
    "astronomia",
    "spazio",
    "dashboard",
  ],
  authors: [{ name: "Nicolas Brazzo" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "/",
    siteName: SITE_NAME,
    title: "NASA NEO Dashboard — Asteroidi vicini alla Terra",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "NASA NEO Dashboard — Asteroidi vicini alla Terra",
    description,
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${plexMono.variable} ${fraunces.variable} ${bricolage.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}