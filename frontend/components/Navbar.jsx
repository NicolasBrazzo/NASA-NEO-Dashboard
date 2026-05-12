"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/asteroids", label: "Esplora" },
  { href: "/stats", label: "Stats" },
];

export const Navbar = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">

        {/* === LOGO ===
            Pallino ambra + "NEO" in serif + separatore + sottotitolo mono.
            Il pallino ha un box-shadow ambra molto leggero per dargli "presenza"
            senza diventare un effetto neon. */}
        <Link href="/" className="flex items-center gap-3 no-underline group">
          <span
            className="w-2 h-2 rounded-full bg-primary"
            style={{ boxShadow: "0 0 8px var(--primary)" }}
            aria-hidden
          />
          <span className="font-serif text-lg font-normal tracking-tight text-foreground">
            NEO
          </span>
          <span className="hidden sm:inline-block h-4 w-px bg-border" aria-hidden />
          <span className="hidden sm:inline-block font-mono text-xs text-muted-foreground">
            NASA Near Earth Objects
          </span>
        </Link>

        {/* === LINKS ===
            Niente background sui link. Solo cambio colore testo + linea ambra
            sotto la pagina attiva. La linea è posizionata a -1px dal bottom
            del link, così si sovrappone al border-b della header e crea
            l'effetto "tab fusa con la barra". */}
        <div className="flex items-center gap-8">
          {links.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`
                  relative py-5 text-sm no-underline
                  transition-colors duration-150
                  ${isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {label}
                {isActive && (
                  <span
                    className="absolute inset-x-0 -bottom-px h-px bg-primary"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
};