/**
 * Catégories de poids officielles FFLDA 2026
 * Source : Règles d'arbitrage FFLDA - Catégories d'âge et de poids 2026
 *
 * U5 / U7 / U9 / U11 : pas de catégorie de poids fixe
 *   → U9/U11 : poules de 4 maxi par poids de corps
 *   → U7 : jeux de lutte, pas de compétition officielle
 */

interface StyleCategories {
  feminine?: number[];
  libre?:    number[];
  greco?:    number[];
}

const TABLE: Record<string, StyleCategories> = {
  U13: {
    feminine: [30, 33, 36, 39, 42, 46, 50, 55, 60],
    libre:    [35, 38, 41, 45, 49, 54, 59, 65, 71],
    greco:    [35, 38, 41, 45, 49, 54, 59, 65, 71],
  },
  U15: {
    feminine: [33, 36, 39, 42, 46, 50, 54, 58, 62, 66],
    libre:    [38, 41, 44, 48, 52, 57, 62, 68, 75, 85],
    greco:    [38, 41, 44, 48, 52, 57, 62, 68, 75, 85],
  },
  U17: {
    feminine: [40, 43, 46, 49, 53, 57, 61, 65, 69, 73],
    libre:    [45, 48, 51, 55, 60, 65, 71, 80, 92, 110],
    greco:    [45, 48, 51, 55, 60, 65, 71, 80, 92, 110],
  },
  U20: {
    feminine: [50, 53, 55, 57, 59, 62, 65, 68, 72, 76],
    libre:    [57, 61, 65, 70, 74, 79, 86, 92, 97, 125],
    greco:    [55, 60, 63, 67, 72, 77, 82, 87, 97, 130],
  },
  Senior: {
    feminine: [50, 53, 55, 57, 59, 62, 65, 68, 72, 76],
    libre:    [57, 61, 65, 70, 74, 79, 86, 92, 97, 125],
    greco:    [55, 60, 63, 67, 72, 77, 82, 87, 97, 130],
  },
  Vétéran: {
    feminine: [55, 63],
    libre:    [62, 70, 78, 88, 100, 130],
    greco:    [62, 70, 78, 88, 100, 130],
  },
};

/** Normalise la catégorie d'âge → clé de TABLE */
function normalizeAge(cat: string): string | null {
  const c = cat.trim().toUpperCase().replace(/[-\s]/g, '');
  if (c === 'U13') return 'U13';
  if (c === 'U15') return 'U15';
  if (c === 'U17') return 'U17';
  if (c === 'U20') return 'U20';
  if (c === 'SENIOR' || c === 'SÉNIOR') return 'Senior';
  if (c.startsWith('VET') || c === 'VÉTÉRAN' || c === 'VETERAN') return 'Vétéran';
  // U5, U7, U9, U11 → pas de catégorie fixe
  return null;
}

/** Normalise le style → clé de StyleCategories */
function normalizeStyle(style: string): keyof StyleCategories | null {
  const s = style.toLowerCase().trim();
  if (s === 'feminine' || s === 'féminine' || s === 'féminin' || s === 'feminin') return 'feminine';
  if (s === 'libre') return 'libre';
  if (s === 'greco' || s === 'gréco' || s.includes('greco') || s.includes('gréco')) return 'greco';
  return null;
}

/**
 * Calcule automatiquement la catégorie de poids selon les règles FFLDA.
 *
 * @param weightKg      Poids mesuré à la pesée (kg)
 * @param ageCategory   Catégorie d'âge (ex: "U13", "Senior")
 * @param style         Style (ex: "libre", "greco", "feminine")
 * @returns  La catégorie de poids sous forme de chaîne (ex: "45", "+71"),
 *           ou null si pas de table pour cette catégorie (U9, U11…)
 */
export function getWeightCategory(
  weightKg: number,
  ageCategory: string,
  style: string
): string | null {
  const ageKey   = normalizeAge(ageCategory);
  if (!ageKey) return null;                // U5/U7/U9/U11 → pas de catégorie fixe

  const styleKey = normalizeStyle(style);
  if (!styleKey) return null;

  const cats = TABLE[ageKey]?.[styleKey];
  if (!cats || cats.length === 0) return null;

  // Premier seuil ≥ poids → catégorie de l'athlète
  for (const limit of cats) {
    if (weightKg <= limit) return String(limit);
  }

  // Au-delà du dernier seuil → catégorie "+"
  return `+${cats[cats.length - 1]}`;
}

/**
 * Retourne toutes les catégories disponibles pour une catégorie d'âge + style.
 * Utile pour afficher un sélecteur ou valider une saisie manuelle.
 */
export function getAvailableCategories(
  ageCategory: string,
  style: string
): string[] | null {
  const ageKey   = normalizeAge(ageCategory);
  const styleKey = normalizeStyle(style);
  if (!ageKey || !styleKey) return null;

  const cats = TABLE[ageKey]?.[styleKey];
  if (!cats) return null;

  return [...cats.map(String), `+${cats[cats.length - 1]}`];
}

/** Indique si une catégorie d'âge a des catégories de poids fixes */
export function hasWeightCategories(ageCategory: string): boolean {
  return normalizeAge(ageCategory) !== null;
}
