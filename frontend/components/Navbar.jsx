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
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="font-mono text-sm font-semibold text-primary tracking-tight">
            NEO
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            / NASA Near Earth Objects
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`
                  relative px-3 py-1.5 text-sm rounded-md no-underline
                  transition-colors duration-150
                  ${isActive
                    ? "text-foreground bg-surface-raised font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-raised"
                  }
                `}
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-px bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

      </nav>
    </header>
  );
};