/**
 * Ordre canonique des catégories d'âge UWW/FFLDA.
 * Les catégories inconnues sont renvoyées en fin de liste, triées alphabétiquement.
 */
export const AGE_CATEGORY_ORDER = ['U5', 'U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'U20', 'Senior'];

const normalize = (s: string) =>
  s.trim().toUpperCase().replace(/[-\s]/g, '');

const normOrder = AGE_CATEGORY_ORDER.map(normalize);

export function sortAgeCategories(cats: string[]): string[] {
  return [...cats].sort((a, b) => {
    const ia = normOrder.indexOf(normalize(a));
    const ib = normOrder.indexOf(normalize(b));
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
}

/** Trie les entrées d'un Object.entries() groupé par catégorie d'âge */
export function sortGroupEntries<T>(entries: [string, T][]): [string, T][] {
  return [...entries].sort(([a], [b]) => {
    const ia = normOrder.indexOf(normalize(a));
    const ib = normOrder.indexOf(normalize(b));
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
}
