/**
 * Utilitaires asynchrones bornés dans le temps.
 *
 * Objectif : garantir qu'une promesse « qui ne se résout jamais » (stockage
 * natif bloqué, fichier inaccessible, réseau absent) ne fige pas
 * l'application. `withTimeout` rejette avec une `TimeoutError` identifiable,
 * ce qui permet à l'appelant de retomber sur un comportement dégradé explicite
 * au lieu d'attendre indéfiniment.
 */

export class TimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(label: string, timeoutMs: number) {
    super(`${label} : délai maximal de ${timeoutMs} ms dépassé.`);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/** `true` si l'erreur provient d'un dépassement de délai de `withTimeout`. */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return (
    error instanceof TimeoutError ||
    (error instanceof Error && error.name === 'TimeoutError')
  );
}

/**
 * Attend `operation` au maximum `timeoutMs` millisecondes.
 *
 * - Résolution normale : la valeur de `operation` est renvoyée.
 * - Rejet de `operation` : l'erreur d'origine est propagée telle quelle.
 * - Délai dépassé : rejet d'une `TimeoutError`.
 *
 * Un `timeoutMs` non fini ou <= 0 désactive la borne (utile pour les tests ou
 * les environnements où l'on veut le comportement d'origine).
 */
export async function withTimeout<T>(
  operation: PromiseLike<T> | Promise<T>,
  timeoutMs: number,
  label = 'Opération'
): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return await operation;
  }

  // La promesse est observée deux fois (course + veille de rejet) : si le
  // délai gagne la course, un rejet tardif de `operation` ne doit pas
  // remonter comme « unhandled promise rejection ».
  const guarded = Promise.resolve(operation);
  guarded.catch(() => undefined);

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      guarded,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new TimeoutError(label, timeoutMs)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

/** Résultat d'une opération bornée : jamais d'exception, un drapeau à la place. */
export interface Settled<T> {
  value: T;
  ok: boolean;
  error?: unknown;
}

/**
 * Exécute `operation` avec un délai maximal et renvoie toujours un résultat.
 * `fallback` est utilisé si l'opération échoue ou dépasse le délai.
 */
export async function settleWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  fallback: T,
  label = 'Opération'
): Promise<Settled<T>> {
  try {
    const value = await withTimeout(operation(), timeoutMs, label);
    return { value, ok: true };
  } catch (error) {
    return { value: fallback, ok: false, error };
  }
}
