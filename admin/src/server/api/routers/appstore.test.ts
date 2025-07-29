import { inferProcedureInput } from '@trpc/server';
import { test } from 'vitest';
import { AppRouter, createCaller } from '~/server/api/root';
import { createTRPCContext } from '~/server/api/trpc';

test('get top app list', async () => {
  const ctx = createTRPCContext({});
  const caller = createCaller(ctx);
  type Input = inferProcedureInput<AppRouter['appstore']['getTopAppList']>;
  const input: Input = {
    amount: 100
  };
  const appList = await caller.appstore.getTopAppList(input);
});
