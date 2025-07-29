import { z } from 'zod';
import { createTRPCRouter, privateProcedure } from '~/server/api/trpc';

export const appstoreRouter = createTRPCRouter({
  getTopAppList: privateProcedure
    .input(
      z
        .object({
          pageIndex: z.number().optional().default(0),
          pageSize: z.number().optional().default(10),
          amount: z.number().optional().default(100)
        })
        .optional()
        .default({})
    )
    .query(async ({ ctx, input }) => {
      const k8sClient = ctx.k8s.k8sClient;
      const appList: { name: string; count: number }[] = [];
      const pageIndex = input.pageIndex;
      const pageSize = input.pageSize;

      const resp = await k8sClient.readNamespacedConfigMap(
        'template-static',
        'template-frontend',
        'true'
      );

      const configMapData = resp.body.data;

      if (configMapData?.['install-count']) {
        const installCountData = configMapData['install-count'];

        const lines = installCountData.split('\n');

        lines.forEach((line) => {
          const [count, ...appNameParts] = line.split(' ');
          const appName = appNameParts.join(' ');

          if (count && appName) {
            appList.push({ name: appName, count: parseInt(count, 10) });
          }
        });
      }

      const totalItems = appList.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      const sortedApList = appList.sort((a, b) => b.count - a.count);
      const limitedAppList = sortedApList.slice(
        pageIndex * pageSize,
        pageIndex * pageSize + pageSize
      );

      return {
        pageIndex: pageIndex,
        pageSize: pageSize,
        totalPages: totalPages,
        totalItems: totalItems,
        appList: limitedAppList
      };
    })
});
