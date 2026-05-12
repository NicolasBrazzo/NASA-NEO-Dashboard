import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// -----------------------------------------------------------------------------
// COSTANTI
// -----------------------------------------------------------------------------
export const MONTHS_IT = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
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