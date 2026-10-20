import { extractTags, formatCount, formatDuration, formatRelativeTime, normalizeTag } from '../format';

describe('formatCount', () => {
  it('affiche les petits nombres tels quels', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(42)).toBe('42');
    expect(formatCount(999)).toBe('999');
  });

  it('abrège les milliers et les millions', () => {
    expect(formatCount(1000)).toBe('1 k');
    expect(formatCount(12840)).toBe('12.8 k');
    expect(formatCount(184300)).toBe('184 k');
    expect(formatCount(2_500_000)).toBe('2.5 M');
  });

  it('protège les valeurs invalides', () => {
    expect(formatCount(-10)).toBe('0');
    expect(formatCount(Number.NaN)).toBe('0');
  });
});

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-10-20T12:00:00.000Z');

  it('gère les instants proches', () => {
    expect(formatRelativeTime('2026-10-20T11:59:30.000Z', now)).toBe("à l'instant");
    expect(formatRelativeTime('2026-10-20T11:45:00.000Z', now)).toBe('il y a 15 min');
    expect(formatRelativeTime('2026-10-20T09:00:00.000Z', now)).toBe('il y a 3 h');
    expect(formatRelativeTime('2026-10-18T12:00:00.000Z', now)).toBe('il y a 2 j');
  });

  it('gère les dates anciennes', () => {
    expect(formatRelativeTime('2026-08-01T12:00:00.000Z', now)).toContain('mois');
    expect(formatRelativeTime('2024-08-01T12:00:00.000Z', now)).toContain('an');
  });

  it('retourne une chaîne vide pour une date invalide', () => {
    expect(formatRelativeTime('pas-une-date', now)).toBe('');
  });
});

describe('formatDuration', () => {
  it('formate en minutes:secondes', () => {
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(75)).toBe('1:15');
    expect(formatDuration(-4)).toBe('0:00');
  });
});

describe('hashtags', () => {
  it('normalise une saisie utilisateur', () => {
    expect(normalizeTag('#Afro Beat')).toBe('afrobeat');
    expect(normalizeTag('  Dakar ')).toBe('dakar');
    expect(normalizeTag('###')).toBe('');
  });

  it('extrait les hashtags uniques d’une légende', () => {
    expect(extractTags('Sunset à #Dakar avec #mbalax et #dakar encore')).toEqual([
      'dakar',
      'mbalax',
    ]);
    expect(extractTags('aucun tag ici')).toEqual([]);
  });
});
