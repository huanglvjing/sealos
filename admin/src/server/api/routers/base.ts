import { env } from '~/env';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const baseRouter = createTRPCRouter({
  getRegionList: publicProcedure.query(async ({ ctx }) => {
    const globalPrisma = ctx.db.globalPrisma;
		const list = await globalPrisma.region.findMany();
    const sortedList = list.sort((a, b) => {
      if (a.uid === env.regionUid) return -1;
      if (b.uid === env.regionUid) return 1;
      else return 0;
    });
    return sortedList
  })
});
