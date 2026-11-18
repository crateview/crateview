import { garbageCollectionStart } from '../../../shared/garbage-collection';
import {
  defineGarbageCollectionHandler,
  requireGarbageCollectionOperator,
} from '../../utils/garbage-collection-access';
import { sameOrigin } from '../../utils/registry';
import { validated } from '../../utils/validation';

export default defineGarbageCollectionHandler(async (event) => {
  sameOrigin(event);
  const provider = await requireGarbageCollectionOperator(event);
  if (getRequestHeader(event, 'content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json')
    throw createError({ statusCode: 400, statusMessage: 'JSON required' });
  const input = validated(garbageCollectionStart, await readBody(event));
  const snapshot = await provider.start(input);
  setResponseStatus(event, 202);
  return snapshot;
});
