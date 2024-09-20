import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// 定义用户路由器
export const userRouter = createTRPCRouter({
    getList: publicProcedure
				.input(z.object({ 
					pageIndex: z.number().optional().default(0),
					pageSize: z.number().optional().default(10),
				}).optional().default({}))
        .query(async ({ctx, input}) => {
						const globalPrisma = ctx.db.globalPrisma;
						
						const users = await globalPrisma.user.findMany({
								skip: input.pageIndex * input.pageSize,
								take: input.pageSize,
						});
						const uids = users.map((user) => user.uid);
				
						// todo uids.forEach()
				
						const accounts = await globalPrisma.account.findMany({
								where: {
										userUid: {
												in: uids
										}
								}
						});
				
				
						const realNameInfos = await globalPrisma.userRealNameInfo.findMany({
								where: {
										userUid: {
												in: uids
										}
								}
						});
				
						const accountMap = accounts.reduce((map: Record<string, any>, account) => {
								map[account.userUid] = account;
								return map;
						}, {});
				
						const realNameInfoMap = realNameInfos.reduce((map: Record<string, any>, info) => {
								map[info.userUid] = info;
								return map;
						}, {});
				
						return users.map((user) => {
								const account = accountMap[user.uid] || {};
								const realNameInfo = realNameInfoMap[user.uid] || {};
				
								return {
										uid: user.uid,
										id: user.id,
										nickname: user.nickname,
										deductionBalance: account.deduction_balance || null,
										realName: realNameInfo.realName || null,
										idCard: realNameInfo.idCard || null,
										phone: realNameInfo.phone || null
								};
						});
        }),
});
