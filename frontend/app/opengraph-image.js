import { ImageResponse } from "next/og";

// =============================================================================
// OPEN GRAPH IMAGE
// Immagine condivisa generata a build-time per le anteprime social.
// Ereditata automaticamente da tutte le route (og:image + twitter:image).
// =============================================================================

export const alt =
  "NASA NEO Dashboard — Tracciamento degli asteroidi vicini alla Terra";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0b",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Riga superiore — eyebrow */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              color: "#e8a23e",
              fontSize: 24,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            Center for Near-Earth Object Studies
          </div>
          <div style={{ color: "#6b6b6b", fontSize: 22 }}>NASA · NeoWs API</div>
        </div>

        {/* Titolo centrale */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              color: "#efefed",
              fontSize: 96,
              fontWeight: 600,
              lineHeight: 1.05,
            }}
          >
            NASA NEO Dashboard
          </div>
          <div
            style={{
              color: "#a0a0a0",
              fontSize: 36,
              lineHeight: 1.4,
              maxWidth: 920,
            }}
          >
            Ogni asteroide che sfiora la Terra, tracciato giorno per giorno.
          </div>
        </div>

        {/* Riga inferiore */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#e8a23e",
            }}
          />
          <div style={{ color: "#6b6b6b", fontSize: 22 }}>
            Bollettino settimanale · Statistiche · Catalogo completo
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
