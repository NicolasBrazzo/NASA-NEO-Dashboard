import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// -----------------------------------------------------------------------------
// COSTANTI
// -----------------------------------------------------------------------------
export const MONTHS_IT = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];

export const LUNAR_DISTANCE_KM = 384_400;

// -----------------------------------------------------------------------------
// FORMATTAZIONE NUMERI
// -----------------------------------------------------------------------------

// 1234567 → "1.234.567 km"
export const formatDistance = (km) => {
  return new Intl.NumberFormat("it-IT").format(Math.round(km)) + " km";
};

// 1234567 → "1.234.567 km/h"
export const formatSpeed = (kmh) => {
  return new Intl.NumberFormat("it-IT").format(Math.round(kmh)) + " km/h";
};

// 0.12, 0.45 → "0.285 km"
export const formatDiameter = (min, max) => {
  return ((min + max) / 2).toFixed(3) + " km";
};

// 1234567 → "1.234.567" (solo il numero, senza unità)
// Utile quando vuoi mettere l'unità a parte (es. KPI con "km" in mono più piccolo)
export const formatKm = (km) => {
  return Math.round(Number(km)).toLocaleString("it-IT");
};

// 543200 → "×1.4 Terra–Luna"
// Calcola quante volte la distanza Terra-Luna è contenuta nella distanza data
export const lunarDistanceLabel = (km) => {
  const ratio = Number(km) / LUNAR_DISTANCE_KM;
  return `×${ratio.toFixed(1)} Terra–Luna`;
};

// -----------------------------------------------------------------------------
// FORMATTAZIONE DATE
// -----------------------------------------------------------------------------

// Converte una data dal formato americano/ISO (YYYY-MM-DD) al formato
// italiano (DD-MM-YYYY). Lavora sulla stringa per evitare problemi di
// fuso orario; eventuale parte oraria (es. "...T12:00") viene ignorata.
// "2026-05-12" → "12-05-2026"
// Se l'input non corrisponde al formato atteso viene restituito invariato.
export const formatDateIt = (iso) => {
  if (typeof iso !== "string") return iso ?? "";
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return iso;
  const [, year, month, day] = match;
  return `${day}-${month}-${year}`;
};

// Range tra due date ISO → stringa italiana editoriale
// "2026-05-05" + "2026-05-12" → "5 — 12 maggio 2026"
// Se i mesi differiscono → "30 aprile — 6 maggio 2026"
export const formatDateRange = (startIso, endIso) => {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const sDay = s.getDate();
  const eDay = e.getDate();
  const sMonth = MONTHS_IT[s.getMonth()];
  const eMonth = MONTHS_IT[e.getMonth()];
  const year = e.getFullYear();
  if (s.getMonth() === e.getMonth()) {
    return `${sDay} — ${eDay} ${eMonth} ${year}`;
  }
  return `${sDay} ${sMonth} — ${eDay} ${eMonth} ${year}`;
};

// Singola data ISO in italiano
// "2026-05-12" → "12 maggio 2026"
export const formatDateLong = (iso) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_IT[d.getMonth()]} ${d.getFullYear()}`;
};

// -----------------------------------------------------------------------------
// HELPER DATE RANGE
// -----------------------------------------------------------------------------

// Restituisce il range degli ultimi 7 giorni in formato YYYY-MM-DD
// per le query al backend NEO
export const getLastWeekRange = () => {
  const date = new Date();
  const endDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const startDateObj = new Date();
  startDateObj.setDate(date.getDate() - 7);
  const startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, "0")}-${String(startDateObj.getDate()).padStart(2, "0")}`;
  return { startDate, endDate };
};

// Oggi in formato YYYY-MM-DD
export const getToday = () => new Date().toISOString().split("T")[0];

// -----------------------------------------------------------------------------
// API ERROR PARSING
// -----------------------------------------------------------------------------

// Legge una risposta HTTP non-ok e restituisce { message, status }.
// I messaggi italiani vengono dal backend (body.detail); il 429 viene
// arricchito con il header Retry-After se presente.
export async function parseApiError(res) {
  const status = res.status;
  if (status === 429) {
    const retryAfter = res.headers.get("retry-after");
    const message = retryAfter
      ? `Limite di richieste NASA raggiunto. Riprova tra ${retryAfter} secondi.`
      : "Limite di richieste NASA raggiunto. Riprova tra qualche minuto.";
    return { message, status };
  }
  try {
    const body = await res.json();
    return { message: body.detail ?? `Errore del server (${status}).`, status };
  } catch {
    return { message: `Errore del server (${status}).`, status };
  }
}

// Github icon per i link
export const githubIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.071 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.2 22 16.447 22 12.021 22 6.484 17.522 2 12 2z" />
  </svg>
);

export const instagramIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
