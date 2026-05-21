import Link from "next/link";
import { Mail, ArrowUpRight } from "lucide-react";
import { githubIcon, instagramIcon } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/asteroids", label: "Esplora Asteroidi" },
  { href: "/stats", label: "Statistiche" },
];

const DATA_SOURCES = [
  { href: "https://api.nasa.gov", label: "NASA NeoWs API" },
  { href: "https://cneos.jpl.nasa.gov", label: "CNEOS · JPL" },
  {
    href: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html",
    label: "JPL Small-Body DB",
  },
];

export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 py-14 sm:py-16">
        {/* === COLONNE PRINCIPALI === */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-10 lg:gap-8">
          {/* --- Chi sono --- */}
          <div className="flex flex-col gap-6">
            {/* Logo — specchio della Navbar */}
            <div className="flex items-center gap-3">
              <span
                className="w-2 h-2 rounded-full bg-primary shrink-0"
                style={{ boxShadow: "0 0 8px var(--primary)" }}
                aria-hidden="true"
              />
              <span className="font-serif text-lg font-normal tracking-tight text-foreground">
                NEO
              </span>
              <span
                className="h-4 w-px bg-border hidden sm:block"
                aria-hidden="true"
              />
              <span className="font-mono text-xs text-muted-foreground hidden sm:block">
                NASA Near Earth Objects
              </span>
            </div>

            {/* Bio — EDIT: sostituisci con la tua descrizione */}
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[38ch]">
              Sono un giovane sviluppatore appassionato di questo lavoro, sempre
              alla ricerca di nuove sfide e opportunità per crescere. Questa per
              me è stata una sfida, ho utilizzato tecnologie mai utilizzate
              prima, e mi sono divertito un sacco a costruire questo progetto.
              Grazie "ilprogrammatoreignorante" per questa sfida.
            </p>

            {/* Social */}
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/NicolasBrazzo"
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 border border-border rounded-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors duration-150 no-underline"
              >
                {githubIcon}
              </a>
              <a
                href="mailto:nicolasbrazzo8@gmail.com"
                aria-label="Email"
                className="flex items-center justify-center w-8 h-8 border border-border rounded-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors duration-150 no-underline"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
              </a>
              {/* EDIT: sostituisci YOUR_HANDLE con il tuo username Instagram */}
              <a
                href="https://www.instagram.com/brazz0_/"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 border border-border rounded-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors duration-150 no-underline"
              >
                {instagramIcon}
              </a>
            </div>
          </div>

          {/* --- Navigazione --- */}
          <div className="flex flex-col gap-4">
            <span className="text-label">Navigazione</span>
            <nav className="flex flex-col gap-2.5" aria-label="Link pagine">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-muted-foreground hover:text-foreground no-underline transition-colors duration-150"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* --- Fonti dati --- */}
          <div className="flex flex-col gap-4">
            <span className="text-label">Fonti dati</span>
            <nav className="flex flex-col gap-2.5" aria-label="Link fonti dati">
              {DATA_SOURCES.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group text-sm text-muted-foreground hover:text-foreground no-underline transition-colors duration-150 flex items-center gap-1.5"
                >
                  {label}
                  <ArrowUpRight
                    className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition-opacity duration-150"
                    aria-hidden="true"
                  />
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* === BARRA INFERIORE === */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-meta" style={{ margin: 0 }}>
            © {new Date().getFullYear()} NicolasBrazzo · Progetto open source V1.0.0
          </p>
          <p className="text-meta" style={{ margin: 0 }}>
            Dati forniti da{" "}
            <a
              href="https://api.nasa.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors duration-150"
            >
              NASA Open APIs
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
