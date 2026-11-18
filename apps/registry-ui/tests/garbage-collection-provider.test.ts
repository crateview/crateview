import { describe, expect, it, vi } from 'vitest';
import { garbageCollectionOperator, garbageCollectionProvider } from '../server/utils/garbage-collection';
import { garbageCollectionStart } from '../shared/garbage-collection';

const config = {
  registryGarbageCollectionEnabled: true,
  registryGarbageCollectionOrigin: 'https://maintenance.example.test/',
  registryGarbageCollectionToken: 'fixture-token',
};
const active = { revision: 'r2', run: { id: 'run-1', state: 'running' } };

describe('garbage collection provider', () => {
  it('requires explicit enablement and private HTTPS configuration', () => {
    expect(() => garbageCollectionProvider({ ...config, registryGarbageCollectionEnabled: false })).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
    for (const origin of [
      'http://maintenance.example.test/',
      'https://maintenance.example.test/path',
      'https://maintenance.example.test/?query',
      'https://maintenance.example.test/#fragment',
      'https://name:password@maintenance.example.test/',
      '',
    ]) {
      expect(() => garbageCollectionProvider({ ...config, registryGarbageCollectionOrigin: origin })).toThrow(
        expect.objectContaining({ statusCode: 503 }),
      );
    }
    expect(() => garbageCollectionProvider({ ...config, registryGarbageCollectionToken: '' })).toThrow(
      expect.objectContaining({ statusCode: 503 }),
    );
  });

  it('allows only explicitly named operators', () => {
    expect(garbageCollectionOperator('admin, operator', 'operator')).toBe(true);
    for (const [allowed, user] of [
      ['*', 'operator'],
      ['*', '*'],
      ['', 'operator'],
      ['operator', 'Operator'],
      ['operator', ''],
    ]) {
      expect(garbageCollectionOperator(allowed!, user!)).toBe(false);
    }
  });

  it('uses a fixed path, bounded fetch, no redirects, and sanitized replies', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ revision: 'r1', run: null }));
    request.mockResolvedValueOnce(
      Response.json(
        { ...active, logs: 'private data', run: { ...active.run, command: 'private command' } },
        { status: 202 },
      ),
    );
    const provider = garbageCollectionProvider(config, request);
    await expect(provider.status()).resolves.toEqual({ revision: 'r1', run: null });
    await expect(provider.start({ revision: 'r1' })).resolves.toEqual(active);
    expect(request).toHaveBeenNthCalledWith(
      2,
      'https://maintenance.example.test/garbage-collection',
      expect.objectContaining({
        method: 'POST',
        body: '{"revision":"r1"}',
        redirect: 'manual',
        signal: expect.any(AbortSignal),
        headers: expect.objectContaining({ Authorization: 'Bearer fixture-token' }),
      }),
    );
  });

  it('rejects invalid or unexpected responses without passing through provider details', async () => {
    const run = { ...active.run, state: 'succeeded' };
    const request = vi.fn<typeof fetch>();
    const provider = garbageCollectionProvider(config, request);
    request.mockResolvedValueOnce(new Response('private details', { status: 409 }));
    await expect(provider.start({ revision: 'r1' })).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: 'Garbage collection start conflict',
    });
    request.mockResolvedValueOnce(Response.json({ ...active, run }, { status: 202 }));
    await expect(provider.start({ revision: 'r1' })).rejects.toMatchObject({ statusCode: 502 });
    request.mockResolvedValueOnce(Response.json({ revision: 'r2', run: { id: 'r', state: 'wrong' } }));
    await expect(provider.status()).rejects.toMatchObject({ statusCode: 502 });
    request.mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: 'https://other.test' } }));
    await expect(provider.status()).rejects.toMatchObject({ statusCode: 502 });
    request.mockRejectedValueOnce(new DOMException('private details', 'TimeoutError'));
    await expect(provider.status()).rejects.toMatchObject({ statusCode: 504 });
  });

  it('accepts only a non-empty bounded revision as start input', () => {
    expect(garbageCollectionStart.safeParse({ revision: 'r1' }).success).toBe(true);
    expect(garbageCollectionStart.safeParse({ revision: 'r1', target: 'other' }).success).toBe(false);
    expect(garbageCollectionStart.safeParse({ revision: '' }).success).toBe(false);
    expect(garbageCollectionStart.safeParse({ revision: 'a'.repeat(129) }).success).toBe(false);
  });
});
