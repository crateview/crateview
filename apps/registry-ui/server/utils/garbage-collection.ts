import { createError } from 'h3';
import { garbageCollectionSnapshot, type GarbageCollectionStart } from '../../shared/garbage-collection';
import { enabled } from './monitoring-core';

interface GarbageCollectionConfig {
  registryGarbageCollectionEnabled: unknown;
  registryGarbageCollectionOrigin: string;
  registryGarbageCollectionToken: string;
}

/** Match only explicitly listed usernames; this permission never supports wildcards. */
export function garbageCollectionOperator(allowlist: string, username: string) {
  return Boolean(username) && username !== '*' && allowlist.split(',').some((entry) => entry.trim() === username);
}

/** Bind start and status to the single privately configured maintenance adapter. */
export function garbageCollectionProvider(config: GarbageCollectionConfig, request = fetch) {
  if (!enabled(config.registryGarbageCollectionEnabled))
    throw createError({ statusCode: 404, statusMessage: 'Garbage collection disabled' });

  const origin = URL.parse(config.registryGarbageCollectionOrigin);
  const token = config.registryGarbageCollectionToken;
  if (
    !origin ||
    origin.protocol !== 'https:' ||
    origin.href !== `${origin.origin}/` ||
    !/^[A-Za-z0-9._~+/-]+=*$/.test(token)
  )
    throw createError({ statusCode: 503, statusMessage: 'Garbage collection provider not configured' });

  const url = `${origin.origin}/garbage-collection`;

  async function send(start?: GarbageCollectionStart) {
    const signal = AbortSignal.timeout(10_000);
    let response: Response;
    try {
      response = await request(url, {
        method: start ? 'POST' : 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          ...(start ? { 'Content-Type': 'application/json' } : {}),
        },
        body: start ? JSON.stringify(start) : undefined,
        signal,
        redirect: 'manual',
        cache: 'no-store',
      });
    } catch (error) {
      if (signal.aborted || (error instanceof Error && error.name === 'TimeoutError'))
        throw createError({ statusCode: 504, statusMessage: 'Garbage collection provider timed out' });
      throw createError({ statusCode: 503, statusMessage: 'Garbage collection provider unavailable' });
    }

    if (response.status !== (start ? 202 : 200)) {
      await response.body?.cancel().catch(() => {});
      if (start && response.status === 409)
        throw createError({ statusCode: 409, statusMessage: 'Garbage collection start conflict' });
      if (response.status >= 500)
        throw createError({ statusCode: 503, statusMessage: 'Garbage collection provider unavailable' });
      throw createError({ statusCode: 502, statusMessage: 'Invalid garbage collection provider response' });
    }

    const raw: unknown = await response.json().catch(() => undefined);
    if (signal.aborted) throw createError({ statusCode: 504, statusMessage: 'Garbage collection provider timed out' });
    const result = garbageCollectionSnapshot.safeParse(raw);
    if (!result.success || (start && (result.data.run?.state !== 'running' || result.data.revision === start.revision)))
      throw createError({ statusCode: 502, statusMessage: 'Invalid garbage collection provider response' });
    return result.data;
  }

  return { status: () => send(), start: (input: GarbageCollectionStart) => send(input) };
}
