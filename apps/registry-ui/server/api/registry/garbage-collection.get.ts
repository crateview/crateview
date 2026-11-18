import {
  defineGarbageCollectionHandler,
  requireGarbageCollectionOperator,
} from '../../utils/garbage-collection-access';

export default defineGarbageCollectionHandler(async (event) => {
  const provider = await requireGarbageCollectionOperator(event);
  return provider.status();
});
