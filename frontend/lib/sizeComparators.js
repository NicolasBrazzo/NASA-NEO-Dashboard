// lib/sizeComparators.js
//
// Trasforma un diametro in metri in un paragone compatto.
// Esempi di output:
//   "×1 Campo da calcio"                (caso x1: singolare)
//   "~×1.4 Campi da calcio"             (decimale: tilde davanti)
//   "×4 Campi da calcio"                (intero: niente tilde)
//   "×24 Campi da calcio"               (grandi numeri: arrotondato)
//   "Più piccolo del Monte Bianco"      (fallback testuale per casi rari)
//
// La scelta del comparatore è deterministica in base all'ID dell'asteroide:
// lo stesso asteroide produrrà sempre lo stesso paragone tra navigazioni.

// -----------------------------------------------------------------------------
// CATALOGO COMPARATORI
// -----------------------------------------------------------------------------
// Ogni ref ha:
//   singular:       forma singolare CON articolo (es. "il Burj Khalifa")
//                   usata SOLO per il fallback "Più piccolo di X"
//   singularPlain:  forma singolare SENZA articolo (es. "Burj Khalifa")
//                   usata per "×1 X"
//   plural:         forma plurale SENZA articolo (es. "Burj Khalifa")
//                   usata per "×N X" con N > 1
//   size:           dimensione lineare in metri (lunghezza o altezza maggiore)
// -----------------------------------------------------------------------------

const BANDS = [
  {
    name: "micro",   // 0 - 15 m
    max: 15,
    refs: [
      { singular: "una Fiat 500",            singularPlain: "Fiat 500",            plural: "Fiat 500",            size: 3.6  },
      { singular: "una giraffa adulta",      singularPlain: "Giraffa adulta",      plural: "Giraffe adulte",      size: 5.5  },
      { singular: "un canestro NBA",         singularPlain: "Canestro NBA",        plural: "Canestri NBA",        size: 3.05 },
      { singular: "un T-Rex",                singularPlain: "T-Rex",               plural: "T-Rex",               size: 12   },
    ],
  },
  {
    name: "small",   // 15 - 60 m
    max: 60,
    refs: [
      { singular: "un autobus urbano",       singularPlain: "Autobus urbano",      plural: "Autobus urbani",      size: 12   },
      { singular: "una balena blu",          singularPlain: "Balena blu",          plural: "Balene blu",          size: 25   },
      { singular: "un campo da tennis",      singularPlain: "Campo da tennis",     plural: "Campi da tennis",     size: 23.77},
      { singular: "una piscina olimpica",    singularPlain: "Piscina olimpica",    plural: "Piscine olimpiche",   size: 50   },
      { singular: "la Torre di Pisa",        singularPlain: "Torre di Pisa",       plural: "Torri di Pisa",       size: 56   },
    ],
  },
  {
    name: "medium",  // 60 - 200 m
    max: 200,
    refs: [
      { singular: "un jumbo jet",            singularPlain: "Jumbo jet",           plural: "Jumbo jet",           size: 76   },
      { singular: "la Statua della Libertà", singularPlain: "Statua della Libertà", plural: "Statue della Libertà", size: 93 },
      { singular: "il Big Ben",              singularPlain: "Big Ben",             plural: "Big Ben",             size: 96   },
      { singular: "un campo da calcio",      singularPlain: "Campo da calcio",     plural: "Campi da calcio",     size: 105  },
      { singular: "il Duomo di Milano",      singularPlain: "Duomo di Milano",     plural: "Duomi di Milano",     size: 158  },
      { singular: "la Mole Antonelliana",    singularPlain: "Mole Antonelliana",   plural: "Moli Antonelliane",   size: 167.5},
      { singular: "il Colosseo",             singularPlain: "Colosseo",            plural: "Colossei",            size: 189  },
    ],
  },
  {
    name: "large",   // 200 - 500 m
    max: 500,
    refs: [
      { singular: "lo stadio di San Siro",   singularPlain: "Stadio di San Siro",  plural: "Stadi di San Siro",   size: 236  },
      { singular: "il Burj al Arab",         singularPlain: "Burj al Arab",        plural: "Burj al Arab",        size: 321  },
      { singular: "la Tour Eiffel",          singularPlain: "Tour Eiffel",         plural: "Tour Eiffel",         size: 330  },
      { singular: "una portaerei Nimitz",    singularPlain: "Portaerei Nimitz",    plural: "Portaerei Nimitz",    size: 333  },
      { singular: "l'Empire State Building", singularPlain: "Empire State Building", plural: "Empire State Building", size: 381 },
    ],
  },
  {
    name: "huge",    // 500 - 2000 m
    max: 2000,
    refs: [
      { singular: "lo Shanghai Tower",       singularPlain: "Shanghai Tower",      plural: "Shanghai Tower",      size: 632  },
      { singular: "il Burj Khalifa",         singularPlain: "Burj Khalifa",        plural: "Burj Khalifa",        size: 828  },
      { singular: "Central Park",            singularPlain: "Central Park",        plural: "Central Park",        size: 800  },
      { singular: "il ponte di Brooklyn",    singularPlain: "Ponte di Brooklyn",   plural: "Ponti di Brooklyn",   size: 1825 },
    ],
  },
  {
    name: "mega",    // > 2000 m
    max: Infinity,
    refs: [
      { singular: "il Monte Bianco",         singularPlain: "Monte Bianco",        plural: "Monti Bianchi",       size: 4810  },
      { singular: "l'isola di Capri",        singularPlain: "Isola di Capri",      plural: "Isole di Capri",      size: 6000  },
      { singular: "il Canale di Suez",       singularPlain: "Canale di Suez",      plural: "Canali di Suez",      size: 24000 },
      { singular: "il Lago di Como",         singularPlain: "Lago di Como",        plural: "Laghi di Como",       size: 46000 },
    ],
  },
];

// -----------------------------------------------------------------------------
// HASH DETERMINISTICA (djb2)
// -----------------------------------------------------------------------------
// Converte una stringa in un intero stabile e non negativo. Garantisce che
// lo stesso ID asteroide produca SEMPRE lo stesso ref (utile per stabilità
// tra navigazioni: 2025 KP1 mostrerà sempre "Campi da calcio", mai "Big Ben").
function hashId(id) {
  const s = String(id);
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// -----------------------------------------------------------------------------
// PREPOSIZIONE ARTICOLATA "di + articolo"
// -----------------------------------------------------------------------------
// Usata SOLO per il fallback testuale "Più piccolo di X".
//   "un autobus urbano"   -> "di un autobus urbano"
//   "il Burj Khalifa"     -> "del Burj Khalifa"
//   "la Tour Eiffel"      -> "della Tour Eiffel"
//   "lo Shanghai Tower"   -> "dello Shanghai Tower"
//   "l'Empire State..."   -> "dell'Empire State..."
function diOf(singular) {
  if (singular.startsWith("l'"))   return "dell'" + singular.slice(2);
  if (singular.startsWith("il "))  return "del "  + singular.slice(3);
  if (singular.startsWith("lo "))  return "dello "+ singular.slice(3);
  if (singular.startsWith("la "))  return "della "+ singular.slice(3);
  if (singular.startsWith("un "))  return "di "   + singular;
  if (singular.startsWith("una ")) return "di "   + singular;
  return "di " + singular;
}

// -----------------------------------------------------------------------------
// API PRINCIPALE
// -----------------------------------------------------------------------------
// Ritorna { text, ref, count, band } oppure null se input non valido.
//
// text:  stringa pronta da renderizzare. Per lo stile compatto col
//        moltiplicatore in colore diverso, vedi la versione `parts` qui sotto.
// ref:   il ref scelto (utile per debug o tooltip avanzati)
// count: rapporto numerico raw (utile se vuoi formattare diversamente)
// band:  "micro" | "small" | "medium" | "large" | "huge" | "mega"
// parts: { prefix, mult, label, fallback } per renderizzare il moltiplicatore
//        in un colore diverso. Vedi esempio JSX nei commenti finali.

export function compareSize(diameterMeters, asteroidId) {
  if (
    diameterMeters == null ||
    !Number.isFinite(diameterMeters) ||
    diameterMeters <= 0
  ) {
    return null;
  }

  // 1. Trova la fascia
  const band = BANDS.find((b) => diameterMeters <= b.max) ?? BANDS[BANDS.length - 1];

  // 2. Filtro: tengo solo i ref ≤ del diametro, così il moltiplicatore è >= 1
  //    quasi sempre. Se l'asteroide è più piccolo di TUTTI i ref della fascia
  //    (caso patologico), uso il ref più piccolo come fallback testuale.
  const eligible = band.refs.filter((r) => r.size <= diameterMeters);
  let ref;
  let isUndersized = false;
  if (eligible.length > 0) {
    const idx = hashId(asteroidId) % eligible.length;
    ref = eligible[idx];
  } else {
    ref = band.refs.reduce((min, r) => (r.size < min.size ? r : min), band.refs[0]);
    isUndersized = true;
  }

  // 3. Rapporto
  const rawCount = diameterMeters / ref.size;

  // 4. Costruisco le 4 forme di output
  let text;
  let parts;

  if (isUndersized) {
    // Caso patologico: fallback testuale (asteroide più piccolo di tutti i ref)
    text = `Più piccolo ${diOf(ref.singular)}`;
    parts = { prefix: null, mult: null, label: null, fallback: text };
  } else if (rawCount >= 0.85 && rawCount <= 1.15) {
    // x1: singolare, nessuna tilde
    text = `×1 ${ref.singularPlain}`;
    parts = { prefix: null, mult: "×1", label: ref.singularPlain, fallback: null };
  } else {
    // x>1: decido se mostrare con decimale (e quindi tilde) o intero
    const rounded10 = Math.round(rawCount * 10) / 10;       // a 1 decimale
    const roundedInt = Math.round(rawCount);                 // intero
    const isCloseToInt = Math.abs(rawCount - roundedInt) < 0.07;

    let multStr;
    let prefix;
    if (rawCount >= 10) {
      // Numeri grandi: sempre intero, niente tilde (precisione poco significativa)
      multStr = `×${roundedInt}`;
      prefix = null;
    } else if (isCloseToInt) {
      // Vicino a un intero: intero senza tilde (es. 3.97 -> ×4)
      multStr = `×${roundedInt}`;
      prefix = null;
    } else {
      // Decimale vero: con tilde
      multStr = `×${rounded10.toFixed(1)}`;
      prefix = "~";
    }

    text = `${prefix ?? ""}${multStr} ${ref.plural}`;
    parts = { prefix, mult: multStr, label: ref.plural, fallback: null };
  }

  return { text, parts, ref, count: rawCount, band: band.name };
}

// -----------------------------------------------------------------------------
// COME RENDERIZZARLO IN REACT
// -----------------------------------------------------------------------------
// Versione semplice (stringa unica):
//
//   const r = compareSize(diameter, asteroid.id);
//   {r && <span className="text-muted-foreground font-mono">{r.text}</span>}
//
// Versione con moltiplicatore evidenziato (consigliata, come nel mockup):
//
//   const r = compareSize(diameter, asteroid.id);
//   {r && (
//     r.parts.fallback
//       ? <span className="text-muted-foreground italic">{r.parts.fallback}</span>
//       : <span className="font-mono">
//           {r.parts.prefix && <span className="text-muted-foreground">{r.parts.prefix}</span>}
//           <span className="text-accent font-medium">{r.parts.mult}</span>
//           {" "}
//           <span>{r.parts.label}</span>
//         </span>
//   )}