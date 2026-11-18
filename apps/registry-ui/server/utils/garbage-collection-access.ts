import { createError, defineEventHandler, isError, setResponseHeader, setResponseStatus, type H3Event } from 'h3';
import { accountBackend, accountIdentity, accountMode, requireManagedRegistry } from './accounts';
import { garbageCollectionOperator, garbageCollectionProvider } from './garbage-collection';
import { enabled } from './monitoring-core';
import { registrySession } from './registry';

/** Nitro overwrites Cache-Control for thrown 404s; serialize intentional disabled replies here. */
export function defineGarbageCollectionHandler<T>(handle: (event: H3Event) => Promise<T>) {
  return defineEventHandler(async (event) => {
    setResponseHeader(event, 'Cache-Control', 'no-store');
    try {
      return await handle(event);
    } catch (error) {
      if (!isError(error) || error.statusCode !== 404) throw error;
      setResponseStatus(event, 404);
      return { statusCode: 404, statusMessage: 'Garbage collection disabled' };
    }
  });
}

/** Revalidate the managed registry identity independently from other registry privileges. */
export async function requireGarbageCollectionOperator(event: H3Event) {
  const config = useRuntimeConfig(event);
  if (
    !enabled(config.registryGarbageCollectionEnabled) ||
    accountMode(event) === 'off' ||
    accountBackend(config) === 'off'
  )
    throw createError({ statusCode: 404, statusMessage: 'Garbage collection disabled' });
  const { username, authorization } = (await registrySession(event)).data;
  if (!username || !authorization) throw createError({ statusCode: 401, statusMessage: 'Sign-in required' });
  if (!garbageCollectionOperator(config.registryGarbageCollectionAllowedUsers, username))
    throw createError({ statusCode: 403, statusMessage: 'Garbage collection not allowed' });

  try {
    await requireManagedRegistry(event);
    const identity = await accountIdentity(event);
    if (identity.username !== username)
      throw createError({ statusCode: 403, statusMessage: 'Garbage collection not allowed' });
  } catch (error) {
    const statusCode = (error as { statusCode?: number } | undefined)?.statusCode;
    if (statusCode === 401 || statusCode === 403) throw error;
    throw createError({ statusCode: 503, statusMessage: 'Managed registry authentication unavailable' });
  }
  return garbageCollectionProvider(config);
}
