// =============================================================================
// SEO / OPEN GRAPH
// Helper condiviso per costruire l'oggetto `metadata` delle pagine.
// L'immagine og:image è generata dal file `app/opengraph-image.js` ed è
// ereditata automaticamente da tutte le route.
// =============================================================================

export const SITE_NAME = "NASA NEO Dashboard";

// URL pubblico del sito: usato per `metadataBase` e per gli URL assoluti.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://nasa-neo-dashboard-brz.vercel.app";

/**
 * Costruisce l'oggetto `metadata` per una pagina, includendo title,
 * description e i tag Open Graph / Twitter Card.
 *
 * @param {object} opts
 * @param {string} opts.title - Titolo della pagina.
 * @param {string} opts.description - Descrizione per SEO e anteprime social.
 * @param {string} [opts.path] - Path della route (per canonical e og:url).
 * @param {boolean} [opts.absoluteTitle] - Se true ignora il template del titolo
 *   definito nel layout radice (utile per la homepage).
 * @param {"website"|"article"} [opts.ogType] - Tipo Open Graph.
 * @returns {import("next").Metadata}
 */
export function pageMetadata({
  title,
  description,
  path = "/",
  absoluteTitle = false,
  ogType = "website",
}) {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: ogType,
      locale: "it_IT",
      siteName: SITE_NAME,
      url: path,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
