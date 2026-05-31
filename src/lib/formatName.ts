/**
 * Formate un nom d'athlète : NOM EN MAJUSCULES suivi du Prénom en minuscules (1re lettre en majuscule).
 * Exemples :
 *   formatName('jean', 'DUPONT')       → 'DUPONT Jean'
 *   formatName('marie-claire', 'de la tour') → 'DE LA TOUR Marie-claire'
 */
export function formatName(firstName: string, lastName: string): string {
  const last  = (lastName  || '').trim().toUpperCase();
  const first = (firstName || '').trim();
  // 1re lettre en majuscule, reste en minuscule (gère les tirets aussi)
  const firstFmt = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  return [last, firstFmt].filter(Boolean).join(' ');
}
