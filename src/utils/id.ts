/**
 * Génération d'identifiants côté client.
 *
 * Suffisant pour la démo locale. Avec Supabase, les identifiants seront des
 * UUID générés par la base : la fonction ne sera alors utilisée que pour des
 * clés d'optimistic UI.
 */
export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}
