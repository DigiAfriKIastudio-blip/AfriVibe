import { TimeoutError, isTimeoutError, settleWithTimeout, withTimeout } from '../async';

describe('withTimeout', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renvoie la valeur quand l’opération est plus rapide que le délai', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 1000, 'Test')).resolves.toBe('ok');
  });

  it('rejette avec une TimeoutError quand le délai est dépassé', async () => {
    jest.useFakeTimers();
    const never = new Promise<string>(() => undefined);
    const bounded = withTimeout(never, 1500, 'Base locale');
    const assertion = expect(bounded).rejects.toBeInstanceOf(TimeoutError);
    await jest.advanceTimersByTimeAsync(1500);
    await assertion;
    await expect(bounded).rejects.toThrow('Base locale : délai maximal de 1500 ms dépassé.');
  });

  it('propage l’erreur d’origine sans attendre le délai', async () => {
    jest.useFakeTimers();
    const failing = Promise.reject(new Error('stockage cassé'));
    await expect(withTimeout(failing, 5000, 'Test')).rejects.toThrow('stockage cassé');
  });

  it('ne borne pas l’attente quand le délai est désactivé', async () => {
    await expect(withTimeout(Promise.resolve(42), 0, 'Test')).resolves.toBe(42);
    await expect(withTimeout(Promise.resolve(43), Number.POSITIVE_INFINITY, 'Test')).resolves.toBe(43);
  });

  it('nettoie son minuteur pour ne pas laisser de tâche en attente', async () => {
    jest.useFakeTimers();
    await withTimeout(Promise.resolve('rapide'), 10_000, 'Test');
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('isTimeoutError', () => {
  it('reconnaît les TimeoutError et ignore les autres erreurs', () => {
    expect(isTimeoutError(new TimeoutError('Test', 10))).toBe(true);
    expect(isTimeoutError(new Error('TimeoutError'))).toBe(false);
    expect(isTimeoutError('délai')).toBe(false);
    expect(isTimeoutError(null)).toBe(false);
  });
});

describe('settleWithTimeout', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renvoie la valeur et `ok: true` en cas de succès', async () => {
    const result = await settleWithTimeout(async () => 'données', 1000, 'défaut', 'Section');
    expect(result).toEqual({ value: 'données', ok: true });
  });

  it('retombe sur la valeur par défaut en cas d’erreur', async () => {
    const result = await settleWithTimeout(
      async () => {
        throw new Error('boom');
      },
      1000,
      'défaut',
      'Section'
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe('défaut');
  });

  it('retombe sur la valeur par défaut en cas de délai dépassé', async () => {
    jest.useFakeTimers();
    const pending = settleWithTimeout(
      () => new Promise<string>(() => undefined),
      2000,
      'défaut',
      'Section'
    );
    await jest.advanceTimersByTimeAsync(2000);
    const result = await pending;
    expect(result.ok).toBe(false);
    expect(result.value).toBe('défaut');
    expect(isTimeoutError(result.error)).toBe(true);
  });
});
