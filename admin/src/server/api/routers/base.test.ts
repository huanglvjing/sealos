import { test } from 'vitest';
import { createCaller } from '~/server/api/root';
import { createTRPCContext } from '~/server/api/trpc';

test('get region list', async () => {
  const ctx = createTRPCContext({});
  const caller = createCaller(ctx);

  const regionList = await caller.base.getRegionList();
});
