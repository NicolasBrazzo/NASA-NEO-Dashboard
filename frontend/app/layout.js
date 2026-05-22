import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}