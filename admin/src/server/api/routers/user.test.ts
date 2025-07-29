import { inferProcedureInput } from '@trpc/server';
import { nanoid } from 'nanoid';
import { expect, test } from 'vitest';
import { AppRouter, createCaller } from '~/server/api/root';
import { createInnerTRPCContext } from '~/server/api/trpc';

test('get cost', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['getCost']>;
  const endTime = new Date();
  const startTime = new Date();
  startTime.setDate(endTime.getDate() - 1);
  const input: Input = {
    domain: '192.168.0.55.nip.io',
    startTime: startTime,
    endTime: endTime
  };
  const data = await caller.user.getCost(input);
  console.log(data);
}, 20000);

test('get user', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['getUser']>;
  const input: Input = {
    id: 'fKoCmbXnw3'
  };
  const user = await caller.user.getUser(input);
  console.log(user);
  //expect(user.id).toBe("fKoCmbXnw3");
});

test('get user detail', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['getUserDetail']>;
  const input: Input = {
    id: 'fKoCmbXnw3'
  };
  const user = await caller.user.getUserDetail(input);
  console.log(user);
  //expect(user.id).toBe("fKoCmbXnw3");
});

test('get user list', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['getUserList']>;
  const input: Input = {
    pageIndex: 0,
    pageSize: 20
  };
  const userList = await caller.user.getUserList(input);
  console.log(JSON.stringify(userList, null, 2));
});

test('get user list by id', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['getUserList']>;
  const input: Input = {
    pageIndex: 0,
    pageSize: 10,
    id: 'fKoCmbXnw3'
  };
  const userList = await caller.user.getUserList(input);
  console.log(userList);
});

test('get user list by phone', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['getUserList']>;
  const input: Input = {
    pageIndex: 0,
    pageSize: 10,
    phone: '123456789'
  };
  const userList = await caller.user.getUserList(input);
  console.log(userList);
});

test('get user list by workspace id', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['getUserList']>;
  const input: Input = {
    pageIndex: 0,
    pageSize: 10,
    workspaceId: 'ns-5zk3fb05'
  };
  const userList = await caller.user.getUserList(input);
  console.log(userList);
}, 10000);

test('get user list by workspace name', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['getUserList']>;
  const input: Input = {
    pageIndex: 0,
    pageSize: 10,
    workspaceName: 'test'
  };
  const userList = await caller.user.getUserList(input);
  console.log(userList);
}, 10000);

test('get top user list', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['getTopUserList']>;
  const input: Input = {
    pageIndex: 1,
    pageSize: 10
  };
  const topUserList = await caller.user.getTopUserList(input);
  console.log(topUserList);
});

test('create user', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['createUser']>;
  const input: Input = {
    nickname: nanoid(6),
    phone: nanoid(9),
    email: ''
  };
  const user = await caller.user.createUser(input);
  console.log(user);
});

test('recharge', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['recharge']>;
  const input: Input = {
    id: 'gixZ1LsNto',
    amount: 10
  };
  const resp = await caller.user.recharge(input);
  expect(resp.success).toBe(true);
});

test('get token', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['getToken']>;
  const input: Input = {
    id: 'fKoCmbXnw3'
  };
  const token = await caller.user.getToken(input);
  console.log(token);
  expect(token).not.toMatch(/^undefind/);
});

test('get quota', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['getQuota']>;
  const input: Input = {
    // id: 'gixZ1LsNto'
    id: '78UWI9nr6E'
  };
  const quota = await caller.user.getQuota(input);
  console.log(JSON.stringify(quota, null, 2));
}, 10000);

test('get remote quota', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['getRemoteQuota']>;
  const input: Input = {
    id: 'fKoCmbXnw3',
    //domain: '192.168.0.75.nip.io'
    domain: '127.0.0.1:3000'
  };
  const quota = await caller.user.getRemoteQuota(input);
  console.log(JSON.stringify(quota, null, 2));
}, 10000);

test('update quota', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['updateQuota']>;
  const input: Input = {
    ns: 'ns-5zk3fb05',
    quotaMap: new Map([["cpu", {value: 1000, unit: 'c'}], ["memory", {value: 1280, unit: 'Gi'}], ["storage", {value: 1000, unit: 'Gi'}]])
  };
  const resp = await caller.user.updateQuota(input);
  console.log(resp);
});

test('update remote quota', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['updateRemoteQuota']>;
  const input: Input = {
    // domain: '192.168.0.55.nip.io',
    domain: '127.0.0.1:3000',
    ns: 'ns-5zk3fb05',
    quotaMap: new Map([['objectstorage/size', '100Gi']])
  };
  const resp = await caller.user.updateRemoteQuota(input);
  console.log(JSON.stringify(resp, null, 2));
});

test('get ns', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['getNS']>;
  const input: Input = {
    id: 'fKoCmbXnw3',
    domain: '192.168.0.55.nip.io'
  };
  const ns = await caller.user.getNS(input);
  console.log(JSON.stringify(ns, null, 2));
}, 10000);

test('get remote ns', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['getNS']>;
  const input: Input = {
    id: 'fKoCmbXnw3',
    domain: '192.168.0.55.nip.io'
  };
  const ns = await caller.user.getNS(input);
  console.log(JSON.stringify(ns, null, 2));
}, 10000);

test('get app list', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['appstore']['getTopAppList']>;
  const input: Input = {
    pageIndex: 1,
    pageSize: 10
  };
  const userList = await caller.appstore.getTopAppList(input);
  console.log(JSON.stringify(userList, null, 2));
});

test('get grafana cluster', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['getGrafanaCluster']>;
  const input: Input = {
    domain: "cloud.sealos.io"
  };
  const link = await caller.user.getGrafanaCluster(input);
  console.log(link);
});


test('get grafana cluster', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['getGrafanaCluster']>;
  const input: Input = {
    domain: "cloud.sealos.io"
  };
  const link = await caller.user.getGrafanaCluster(input);
  console.log(link);
});

test('get grafana other', async () => {
  const ctx = createInnerTRPCContext({
    auth: undefined
  });
  const caller = createCaller(ctx);

  type Input = inferProcedureInput<AppRouter['user']['getGrafanaOther']>;
  const input: Input = {
    // type: "consumption"
    //type: "sealosBusiness"
    type: "lafBusiness"
  };
  const link = await caller.user.getGrafanaOther(input);
  console.log(link);
});