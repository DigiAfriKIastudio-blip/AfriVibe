/** Formatage des nombres et des dates pour l'affichage. */

export function formatCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return '0';
  }
  if (value < 1000) {
    return String(Math.round(value));
  }
  if (value < 1_000_000) {
    const thousands = value / 1000;
    return `${thousands >= 100 ? Math.round(thousands) : thousands.toFixed(1).replace('.0', '')} k`;
  }
  const millions = value / 1_000_000;
  return `${millions >= 100 ? Math.round(millions) : millions.toFixed(1).replace('.0', '')} M`;
}

export function formatRelativeTime(isoDate: string, now: number = Date.now()): string {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) {
    return '';
  }
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));

  if (seconds < 60) {
    return "à l'instant";
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `il y a ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `il y a ${hours} h`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `il y a ${days} j`;
  }
  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `il y a ${weeks} sem.`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `il y a ${months} mois`;
  }
  return `il y a ${Math.floor(days / 365)} an(s)`;
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remaining = safe % 60;
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

/** Normalise un hashtag saisi par l'utilisateur : "#Afro Beat" -> "afrobeat". */
export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .replace(/^#+/, '')
    .replace(/[^\p{L}\p{N}_]/gu, '')
    .toLowerCase();
}

/** Extrait les hashtags d'une légende. */
export function extractTags(text: string): string[] {
  const matches = text.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  const tags = matches.map((tag) => normalizeTag(tag)).filter(Boolean);
  return Array.from(new Set(tags));
}
