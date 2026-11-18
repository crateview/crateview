import { z } from 'zod';

const opaqueToken = z.string().min(1).max(128);

export const garbageCollectionStart = z.strictObject({ revision: opaqueToken });
export const garbageCollectionSnapshot = z.object({
  revision: opaqueToken,
  run: z
    .object({
      id: opaqueToken,
      state: z.enum(['running', 'succeeded', 'failed']),
    })
    .nullable(),
});

export type GarbageCollectionStart = z.infer<typeof garbageCollectionStart>;
export type GarbageCollectionSnapshot = z.infer<typeof garbageCollectionSnapshot>;
