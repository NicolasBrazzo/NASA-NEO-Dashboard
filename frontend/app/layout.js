import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { Navbar } from "@/components/Navbar";
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

export const metadata = {
  title: "NASA NEO Dashboard",
  description:
    "Il Centro di Studi degli Oggetti Vicini alla Terra della NASA traccia ogni asteroide che passa nel vicinato del Sistema Solare. I dati sono pubblici, aggiornati quotidianamente, e accessibili via API. La stessa API che usano i ricercatori veri.",
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
      </body>
    </html>
  );
}