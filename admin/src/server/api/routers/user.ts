import { CoreV1Api } from "@kubernetes/client-node";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { MongoClient } from "mongodb";
import { nanoid } from "nanoid";
import global, { $Enums } from "prisma/generated/global-client";
import globalLib from "prisma/generated/global-client/runtime/library";
import region from "prisma/generated/region-client";
import regionLib from "prisma/generated/region-client/runtime/library";
import { z } from "zod";
import { GrafanaEnum } from "~/@types/grafana";
import { regionSchema } from "~/@types/region";
import { createTRPCRouter, otherRegionMiddlewareFactory, privateProcedure } from "~/server/api/trpc";
import ProviderType = $Enums.ProviderType;

type OauthProviderInput = {
	providerId: string;
	providerType: ProviderType;
};
const CpuEnum = z.enum(['m', 'c']);
type CpuEnum = z.infer<typeof CpuEnum>;
const SizeEnum = z.enum(['Ki', 'Mi', 'Gi', 'Ti'])
type SizeEnum = z.infer<typeof SizeEnum>;

type QuotaResult = {
	value: number;
	unit: CpuEnum | SizeEnum;
}

const QuotaNameMap = new Map<string, string>([
	["cpu", "limits.cpu"],
	["memory", "limits.memory"],
	["storage", "requests.storage"]
]);

export const userRouter = createTRPCRouter({
	getCost: privateProcedure
		.input(
			regionSchema
		)
		.use(otherRegionMiddlewareFactory('query'))
		.input(
			z.object({
				startTime: z.date(),
				endTime: z.date()
			})
		)
		.query(async ({ ctx, input }) => {
			const regionMongoClient = ctx.db.regionMongoClient;
			const startTime = input.startTime;
			const endTime = input.endTime;
			const cost = await getLocalCost(regionMongoClient, startTime, endTime);
			return {
				startTime: startTime,
				endTime: endTime,
				cost: {
					userCost: cost.userCost,
					systemCost: cost.systemCost
				}
			};
		}),

	getUser: privateProcedure
		.input(
			z.object({
				id: z.string().min(1)
			})
		)
		.query(async ({ ctx, input }) => {
			const globalPrisma = ctx.db.globalPrisma;
			const id = input.id;

			return queryUserById(globalPrisma, id);
		}),

	getUserDetail: privateProcedure
		.input(
			z
				.object({
					id: z.string().min(1)
				})
		)
		.query(async ({ ctx, input }) => {
			const globalPrisma = ctx.db.globalPrisma;
			const id = input.id;
			return queryUserDetailByUd(globalPrisma, id);
		}),

	getUserList: privateProcedure
		.input(
			z
				.object({
					pageIndex: z.number().int().nonnegative().default(0),
					pageSize: z.number().int().positive().default(10),
					id: z.string().default(''),
					phone: z.string().default(''),
					workspaceId: z.string().default(''),
					workspaceName: z.string().default('')
				})
		)
		.query(async ({ ctx, input }) => {
			const globalPrisma = ctx.db.globalPrisma;
			const regionPrisma = ctx.db.regionPrisma;
			let pageIndex = input.pageIndex;
			let pageSize = input.pageSize;
			const id = input.id;
			const phone = input.phone;
			const workspaceId = input.workspaceId;
			const workspaceName = input.workspaceName;

			let totalPages: number;
			let totalItems = 0;
			let userList = [];
			let done = false;

			if (id != '') {
				const user = await queryUserById(globalPrisma, id);
				userList.push(user);
				totalItems = 1;
				pageIndex = 0;
				pageSize = 1;
				done = true;
			}

			if (phone != '' && !done) {
				const user = await queryUserByPhone(globalPrisma, phone);
				userList.push(user);
				totalItems = 1;
				pageIndex = 0;
				pageSize = 1;
				done = true;
			}

			if (workspaceId != '' && !done) {
				const users = await queryUserByWorkspaceId(globalPrisma, regionPrisma, workspaceId);
				users.forEach((user) => userList.push(user));
				totalItems = users.length;
				pageIndex = 0;
				done = true;
			}

			if (workspaceName != '' && !done) {
				const users = await queryUserByWorkspaceName(globalPrisma, regionPrisma, workspaceName);
				users.forEach((user) => userList.push(user));
				totalItems = users.length;
				pageIndex = 0;
				done = true;
			}

			if (!done) {
				userList = await queryUserList(globalPrisma, pageIndex, pageSize);
				totalItems = await globalPrisma.user.count();
			}

			if (totalItems === 0) {
				totalPages = 0;
			} else {
				totalPages = Math.ceil(totalItems / pageSize);
			}

			return {
				pageIndex: pageIndex,
				pageSize: pageSize,
				totalPages: totalPages,
				totalItems: totalItems,
				userList: userList
			};
		}),

	getTopUserList: privateProcedure
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
			const globalPrisma = ctx.db.globalPrisma;
			const pageIndex = input.pageIndex;
			const pageSize = input.pageSize;

			const accountList = await globalPrisma.account.findMany({
				orderBy: {
					deduction_balance: 'desc'
				},
				take: pageSize,
				skip: pageIndex * pageSize
			});

			const userUidList = accountList.map((account) => account.userUid);

			const balanceMap = new Map(
				accountList.map((account) => [account.userUid, account.deduction_balance])
			);

			const userList = await globalPrisma.user.findMany({
				where: {
					uid: {
						in: userUidList
					}
				},
				include: {
					oauthProvider: true
				}
			});
			const totalItems = await globalPrisma.user.count();
			const totalPages = Math.ceil(totalItems / pageSize);

			const newUserList = userList
				.map((user) => {
					let phone = '';
					let email = '';

					user.oauthProvider.forEach((oauthProvider) => {
						if (oauthProvider.providerType === 'PHONE') {
							phone = oauthProvider.providerId;
						}
						if (oauthProvider.providerType === 'EMAIL') {
							email = oauthProvider.providerId;
						}
					});

					return {
						uid: user.uid,
						id: user.id,
						nickname: user.nickname,
						phone: phone,
						email: email,
						deduction_balance: Number(balanceMap.get(user.uid) ?? 0)
					};
				})
				.sort((a, b) => b.deduction_balance - a.deduction_balance);

			return {
				pageIndex: pageIndex,
				pageSize: pageSize,
				totalPages: totalPages,
				totalItems: totalItems,
				userList: newUserList
			};
		}),

	createUser: privateProcedure
		.input(
			z.object({
				nickname: z.string().min(6),
				phone: z.string().min(9),
				email: z.string().optional().default('')
			})
		)
		.mutation(async ({ ctx, input }) => {
			const globalPrisma = ctx.db.globalPrisma;
			const phone = input.phone;
			const email = input.email;
			const id = nanoid(10);

			const oauthProviders: OauthProviderInput[] = [
				{
					providerId: phone,
					providerType: ProviderType.PHONE
				}
			];

			if (email) {
				oauthProviders.push({
					providerId: email,
					providerType: ProviderType.EMAIL
				});
			}

			return globalPrisma.user.create({
				data: {
					id: id,
					name: id,
					avatarUri: '',
					nickname: input.nickname,
					oauthProvider: {
						create: oauthProviders
					}
				}
			});
		}),

	recharge: privateProcedure
		.input(
			z
				.object({
					id: z.string().min(1),
					amount: z.number().int()
				})
		)
		.mutation(async ({ ctx, input }) => {

			const globalPrisma = ctx.db.globalPrisma;

			const user = await globalPrisma.user.findUnique({
				where: {
					id: input.id
				},
				include: {
					account: true
				}
			});
			if (!user) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'User id null.'
				});
			}
			if(!user.account) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Account id null.'
				});
			}
			if(BigInt(user.account.balance || 0) - BigInt(user.account.deduction_balance || 0) + BigInt(input.amount) * BigInt(1000000) < BigInt(0)) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'User balance not enough.'
				});
			}
			await globalPrisma.account.update({
				where: {
					userUid: user.uid
				},
				data: {
					balance: {
						increment: BigInt(input.amount) * BigInt(1_000_000)
					}
				}
			})

			return { success: true };
		}),

	getQuota: privateProcedure
		.input(regionSchema)
		.use(otherRegionMiddlewareFactory('query'))
		.input(
			z.object({
				id: z.string().min(1),
			})
		)
		.query(async ({ ctx, input: { id } }) => {
			const globalPrisma = ctx.db.globalPrisma;
			const regionPrisma = ctx.db.regionPrisma;
			const k8sClient = ctx.k8s.k8sClient;
			const ns = await getLocalQuota(globalPrisma, regionPrisma, k8sClient, id);
			return ns;
		}),

	updateQuota: privateProcedure
		.input(regionSchema)
		.use(otherRegionMiddlewareFactory('mutation'))
		.input(
			z.object({
				ns: z.string().refine(v => v.startsWith('ns-'), 'Namespace must start with ns-'),
				quotaMap: z.map(z.string(), z.object({
					value: z.number(),
					unit: CpuEnum.or(SizeEnum),
				})).refine(v => v.size > 0)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const k8sClient = ctx.k8s.k8sClient;
			const ns = input.ns;
			const quotaMap = input.quotaMap;
			const quotaName = `quota-${ns}`;

			const quota = await k8sClient.readNamespacedResourceQuota(quotaName, ns);
			quotaMap.forEach((resourceQuota, resourceType) => {
				if (resourceType !== 'cpu' && resourceQuota.value % 1 !== 0) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Memory and storage values can not be set to decimals.'
					});
				}

				if (!quota.body.spec) {
					quota.body.spec = {};
				}

				if (!quota.body.spec.hard) {
					quota.body.spec.hard = {};
				}

				const type = QuotaNameMap.get(resourceType);
				if (type === undefined) {
					console.log("v is undefined. k:", resourceType);
					return
				}

				let value: string;
				if (resourceQuota.unit === 'c') {
					value = resourceQuota.value.toString();
				} else {
					value = resourceQuota.value + resourceQuota.unit;
				}
				quota.body.spec.hard[type] = value;

			});

			const resp = await k8sClient.replaceNamespacedResourceQuota(quotaName, ns, quota.body);

			return {
				code: 200,
				quota: resp.body.spec?.hard
			};
		}),

	getToken: privateProcedure
		.input(
			z
				.object({
					id: z.string()
				})
		)
		.mutation(async ({ ctx, input }) => {
			const token = await generateToken(ctx.db.globalPrisma, input.id, ctx.k8s.generateToken);
			if (ctx.k8s.tokenUrlPrefix === '') {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Token url prefix is null.'
				});
			}
			return ctx.k8s.tokenUrlPrefix + token;
		}),

	// getNS: privateProcedure
	// 	.input(
	// 		z
	// 			.object({
	// 				id: z.string().optional().default(''),
	// 				domain: z.string().optional().default('')
	// 			})
	// 			.optional()
	// 			.default({})
	// 	)
	// 	.query(async ({ ctx, input }) => {
	// 		const globalPrisma = ctx.db.globalPrisma;
	// 		const regionPrisma = ctx.db.regionPrisma;
	// 		const localDomain = ctx.k8s.domain;

	// 		const user = await globalPrisma.user.findUnique({
	// 			where: {
	// 				id: input.id
	// 			}
	// 		});

	// 		if (user === null) {
	// 			throw new TRPCError({
	// 				code: 'NOT_FOUND',
	// 				message: 'User is not found.'
	// 			});
	// 		}

	// 		const nsList = [];

	// 		if (input.domain === '') {
	// 			const regionList = await globalPrisma.region.findMany({});
	// 			const domains = regionList.map((region) => region.domain);
	// 		}
	// 		if (input.domain === localDomain) {
	// 			const ns = await getLocalNS(regionPrisma, user.uid);
	// 			nsList.push({ domain: input.domain, ns: ns });
	// 		} else {
	// 			// @ts-ignore
	// 			const ns = await getRemoteNS(input.id, input.domain);
	// 			nsList.push({ domain: input.domain, ns: ns });
	// 		}

	// 		return nsList;
	// 	}),

	getGrafanaCluster: privateProcedure
		.input(
			z
				.object({
					domain: z.string().optional()
				})
				.default({})
		)
		.query(async ({ ctx, input }) => {
			const domain = input.domain;
			const grafanaKeyList = ctx.grafana.clusterGrafanaKeyList.split(',')
			const grafanaValList = ctx.grafana.clusterGrafanaValList.split(',')

			const grafanaClustersMap = new Map(
				grafanaKeyList.reduce((pre, key, idx) => {
					const url = grafanaValList[idx]
					if (url)
						pre.push([
							key,
							url
						])
					return pre
				}, [
				] as [string, string][])
			)

			const url = grafanaClustersMap.get(domain ?? ctx.k8s.domain);

			if (!url) throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Domain is not exist.'
			});

			return url;
		}),

	getGrafanaOther: privateProcedure
		.input(
			z
				.object({
					type: GrafanaEnum.optional().default('consumption')
				})
				.optional()
				.default({})
		)
		.query(async ({ ctx, input }) => {
			const grafanaConsumption = ctx.grafana.grafanaConsumption;
			const grafanaSealosBusiness = ctx.grafana.grafanaSealosBusiness;
			const grafanaLafBusiness = ctx.grafana.grafanaLafBusiness;
			const type = input.type;

			if (type === GrafanaEnum.enum.consumption) {
				return grafanaConsumption;
			}

			if (type === GrafanaEnum.enum.sealosBusiness) {
				return grafanaSealosBusiness;
			}

			if (type === GrafanaEnum.enum.lafBusiness) {
				return grafanaLafBusiness;
			}

			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Grafana env variable missing.'
			});
		})
});

// query user for id, nickname, phone, email
export async function queryUserById(
	globalPrisma: global.PrismaClient<
		global.Prisma.PrismaClientOptions,
		never,
		globalLib.DefaultArgs
	>,
	id: string
) {
	const user = await globalPrisma.user.findUnique({
		where: {
			id: id
		},
		include: {
			oauthProvider: true
		}
	});

	if (user === null) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'User is not found.'
		});
	}

	let phone = '';
	let email = '';

	user.oauthProvider.forEach((oauthProvider) => {
		if (oauthProvider.providerType === 'PHONE') {
			phone = oauthProvider.providerId;
		}
		if (oauthProvider.providerType === 'EMAIL') {
			email = oauthProvider.providerId;
		}
	});

	return {
		uid: user.uid,
		id: user.id,
		nickname: user.nickname,
		phone: phone,
		email: email
	};
}

export async function queryUserByPhone(
	globalPrisma: global.PrismaClient<
		global.Prisma.PrismaClientOptions,
		never,
		globalLib.DefaultArgs
	>,
	phone: string
) {
	const phoneProvider = await globalPrisma.oauthProvider.findUnique({
		where: {
			providerId_providerType: {
				providerId: phone,
				providerType: 'PHONE'
			}
		},
		include: {
			user: true
		}
	});

	if (phoneProvider === null) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Phone is not found.'
		});
	}

	if (phoneProvider.user === null) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'User is not found.'
		});
	}

	const emailProvider = await globalPrisma.oauthProvider.findMany({
		where: {
			userUid: phoneProvider.userUid,
			providerType: 'EMAIL'
		}
	});

	return {
		id: phoneProvider.user.id,
		nickname: phoneProvider.user.nickname,
		phone: phoneProvider.providerId,
		email: emailProvider[0]?.providerId ?? ''
	};
}

export async function queryUserByWorkspaceId(
	globalPrisma: global.PrismaClient<
		global.Prisma.PrismaClientOptions,
		never,
		globalLib.DefaultArgs
	>,
	regionPrisma: region.PrismaClient<
		region.Prisma.PrismaClientOptions,
		never,
		regionLib.DefaultArgs
	>,
	workspaceId: string
) {
	const workspace = await regionPrisma.workspace.findUnique({
		where: {
			id: workspaceId
		},
		include: {
			userWorkspace: true
		}
	});

	if (workspace === null) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Workspace is not found.'
		});
	}

	const userCrUidList: string[] = [];

	workspace.userWorkspace.forEach((userWorkspace) => {
		userCrUidList.push(userWorkspace.userCrUid);
	});

	const userCrList = await regionPrisma.userCr.findMany({
		where: {
			uid: {
				in: userCrUidList
			}
		}
	});

	const userUidList = userCrList.map((userCr) => userCr.userUid);

	return queryUserListByUid(globalPrisma, userUidList);
}

export async function queryUserByWorkspaceName(
	globalPrisma: global.PrismaClient<
		global.Prisma.PrismaClientOptions,
		never,
		globalLib.DefaultArgs
	>,
	regionPrisma: region.PrismaClient<
		region.Prisma.PrismaClientOptions,
		never,
		regionLib.DefaultArgs
	>,
	workspaceName: string
) {
	const workspaceList = await regionPrisma.workspace.findMany({
		where: {
			displayName: workspaceName
		},
		include: {
			userWorkspace: true
		}
	});

	if (workspaceList === null) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'Workspace is not found.'
		});
	}

	const userCrUidList: string[] = [];

	workspaceList.forEach((workspace) => {
		workspace.userWorkspace.forEach((userWorkspace) => {
			userCrUidList.push(userWorkspace.userCrUid);
		});
	});

	const userCrList = await regionPrisma.userCr.findMany({
		where: {
			uid: {
				in: userCrUidList
			}
		}
	});

	const userUidList = userCrList.map((userCr) => userCr.userUid);

	return queryUserListByUid(globalPrisma, userUidList);
}

// Query user list.
export async function queryUserList(
	globalPrisma: global.PrismaClient<
		global.Prisma.PrismaClientOptions,
		never,
		globalLib.DefaultArgs
	>,
	pageIndex: number,
	pageSize: number
) {
	const users = await globalPrisma.user.findMany({
		skip: pageIndex * pageSize,
		take: pageSize,
		include: {
			oauthProvider: true
		}
	});

	const userList: { id: string; nickname: string; phone: string; email: string }[] = [];

	users.forEach((user) => {
		let phone = '';
		let email = '';

		user.oauthProvider.forEach((oauthProvider) => {
			if (oauthProvider.providerType === 'PHONE') {
				phone = oauthProvider.providerId;
			}
			if (oauthProvider.providerType === 'EMAIL') {
				email = oauthProvider.providerId;
			}
		});

		userList.push({
			id: user.id,
			nickname: user.nickname,
			phone: phone,
			email: email
		});
	});

	return userList;
}

export async function queryUserListByUid(
	globalPrisma: global.PrismaClient<
		global.Prisma.PrismaClientOptions,
		never,
		globalLib.DefaultArgs
	>,
	uidList: string[]
) {
	const users = await globalPrisma.user.findMany({
		where: {
			uid: {
				in: uidList
			}
		},
		include: {
			oauthProvider: true
		}
	});

	const userList: { id: string; nickname: string; phone: string; email: string }[] = [];

	users.forEach((user) => {
		let phone = '';
		let email = '';

		user.oauthProvider.forEach((oauthProvider) => {
			if (oauthProvider.providerType === 'PHONE') {
				phone = oauthProvider.providerId;
			}
			if (oauthProvider.providerType === 'EMAIL') {
				email = oauthProvider.providerId;
			}
		});

		userList.push({
			id: user.id,
			nickname: user.nickname,
			phone: phone,
			email: email
		});
	});

	return userList;
}

// Query user by id. (id, nickname, phone, email, realName, balance, workspace, quota)
export async function queryUserDetailByUd(
	globalPrisma: global.PrismaClient<
		global.Prisma.PrismaClientOptions,
		never,
		globalLib.DefaultArgs
	>,
	id: string
) {
	const user = await queryUserById(globalPrisma, id);

	const account = await globalPrisma.account.findUnique({
		where: {
			userUid: user.uid
		}
	});

	const realNameInfo = await globalPrisma.userRealNameInfo.findUnique({
		where: {
			userUid: user.uid
		}
	});

	const payments = await globalPrisma.payment.findMany({
		where: {
			id: user.id,
			userUid: user.uid,
			invoiced_at: true
		}
	});

	let rechargeAmount = 0n;

	for (const payment of payments) {
		rechargeAmount += payment.amount;
	}

	return {
		uid: user.uid,
		id: user.id,
		nickname: user.nickname,
		realName: realNameInfo?.realName ?? '',
		phone: user.phone,
		email: user.email,
		idCard: realNameInfo?.idCard ?? '',
		balance: account?.balance,
		rechargeAmount: rechargeAmount,
		deductionBalance: account?.deduction_balance
	};
}
export async function getLocalQuota(
	globalPrisma: global.PrismaClient,
	regionPrisma: region.PrismaClient,
	k8sClient: CoreV1Api,
	id: string
) {
	const user = await globalPrisma.user.findUnique({
		where: {
			id: id
		}
	});

	if (user === null) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'User is not found.'
		});
	}

	const userCr = await regionPrisma.userCr.findUnique({
		where: {
			userUid: user.uid
		},
		include: {
			userWorkspace: {
				where: {
					role: 'OWNER'
				},
				include: {
					workspace: true
				}
			}
		}
	});

	if (userCr === null) {
		throw new TRPCError({
			code: 'NOT_FOUND',
			message: 'User cr is not found.'
		});
	}
	const workspaceList = userCr.userWorkspace.map((userWorkspace) => userWorkspace.workspace);
	const resourceQuotaList = [];

	for (const workspace of workspaceList) {
		const rq = await k8sClient.readNamespacedResourceQuota(`quota-${workspace.id}`, workspace.id);

		const hard = rq.body.status?.hard ?? {};
		const used = rq.body.status?.used ?? {};

		const cpuHardVal = hard['limits.cpu'] ?? '';
		const memoryHardVal = hard['limits.memory'] ?? '';
		const storageHardVal = hard['requests.storage'] ?? '';
		const cpuUsedVal = used['limits.cpu'] ?? '';
		const memoryUsedVal = used['limits.memory'] ?? '';
		const storageUsedVal = used['requests.storage'] ?? '';

		const cpuParseHardVal = parseQuotaValue(cpuHardVal, "cpu");
		const memoryParseHardVal = parseQuotaValue(memoryHardVal, "memory");
		const storageParseHardVal = parseQuotaValue(storageHardVal, "storage");
		const cpuParseUsedVal = parseQuotaValue(cpuUsedVal, "cpu");
		const memoryParseUsedVal = parseQuotaValue(memoryUsedVal, "memory");
		const storageParseUsedVal = parseQuotaValue(storageUsedVal, "storage");

		const filterResourceQuotaInfo = {
			hard: {
				cpu: cpuParseHardVal,
				memory: memoryParseHardVal,
				storage: storageParseHardVal
			},
			used: {
				cpu: cpuParseUsedVal,
				memory: memoryParseUsedVal,
				storage: storageParseUsedVal
			}
		};

		resourceQuotaList.push({ workspace, resourceQuotaInfo: filterResourceQuotaInfo });
	}

	return resourceQuotaList;
}

// Get quota of the remote cluster.
// export async function getRemoteQuota(id: string, domain: string) {
// 	const url = `http://${domain}/api/trpc`;
// 	const client = await apiFactory(url, () => `Bearer ` + '');
// 	return await client.query('/getQuota', {
// 		id: id,
// 		domain
// 	});
// }

// // Update quota.
// export async function updateRemoteQuota(ns: string, domain: string, quotaMap: Map<string, { value: number; unit: string; }>) {
// 	const url = `http://${domain}/api/trpc/user/updateRemoteQuota?ns=${ns}&domain=${domain}&quotaMap=${quotaMap}`;
// 	const resp = await axios.get(url);
// 	return resp.data;
// }

// Generate user login token.
export async function generateToken(
	globalPrisma: global.PrismaClient<
		global.Prisma.PrismaClientOptions,
		never,
		globalLib.DefaultArgs
	>,
	id: string,
	generateToken: string
) {
	try {
		// 查找用户
		const user = await globalPrisma.user.findMany({
			where: {
				id: id
			}
		});

		// 检查用户是否存在
		if (!user) {
			console.error('User is null.');
			return null;
		}

		// 检查用户 UID 的长度
		if (user.length === 0) {
			console.error('No user found with the given id.');
			return null;
		}
		if (user.length > 1) {
			console.error('Multiple users found with the given id.');
			return null;
		}

		// 构建负载
		// @ts-ignore
		const uid = user[0].uid;
		const payload = {
			userId: id,
			userUid: uid
		};

		// 返回生成的 JWT
		return jwt.sign(payload, generateToken, { expiresIn: '3h' });
	} catch (error) {
		console.error('Error generating token:', error);
		return null;
	}
}

// Get the namespace of the user in the local cluster.
// export async function getLocalNS(
// 	regionPrisma: region.PrismaClient<
// 		region.Prisma.PrismaClientOptions,
// 		never,
// 		regionLib.DefaultArgs
// 	>,
// 	uid: string
// ) {
// 	const userCr = await regionPrisma.userCr.findUnique({
// 		where: {
// 			userUid: uid
// 		}
// 	});

// 	if (userCr === null) {
// 		throw new TRPCError({
// 			code: 'NOT_FOUND',
// 			message: 'User cr is not found.'
// 		});
// 	}

// 	const userWorkspaceList = await regionPrisma.userWorkspace.findMany({
// 		where: {
// 			userCrUid: userCr.uid,
// 			role: 'OWNER'
// 		}
// 	});

// 	const workspaceUids = userWorkspaceList.map((userWorkspace) => userWorkspace.workspaceUid);

// 	const workspaceList = await regionPrisma.workspace.findMany({
// 		where: {
// 			uid: {
// 				in: workspaceUids
// 			}
// 		}
// 	});

// 	return workspaceList.map((workspace) => workspace.id);
// }

// // Get the namespace of the user of the remote cluster.
// export async function getRemoteNS(id: string, domain: string) {
// 	const url = `http://${domain}/api/trpc/user/getNS?id=${id}&domain=${domain}`;
// 	const client = await apiFactory(url, () => `Bearer ` + '');
// 	try {
// 		return await client.query('/getQuota');
// 	} catch (error) {
// 		console.error(error);
// 		throw error;
// 	}
// }

export async function getLocalCost(regionMongoClient: MongoClient, startTime: Date, endTime: Date) {
	const systemData = await regionMongoClient
		.db('sealos-resources')
		.collection('billing')
		.find({
			owner: 'sealos-system',
			time: { $gt: startTime, $lt: endTime }
		})
		.toArray();

	const userData = await regionMongoClient
		.db('sealos-resources')
		.collection('billing')
		.find({
			owner: { $ne: 'sealos-system' },
			time: { $gt: startTime, $lt: endTime }
		})
		.toArray();

	const systemCost = systemData.reduce((accumulator, current) => {
		return accumulator + current.amount;
	}, 0);

	const userCost = userData.reduce((accumulator, current) => {
		return accumulator + current.amount;
	}, 0);

	return {
		userCost: userCost,
		systemCost: systemCost
	};
}

// export async function getRemoteCost(startTime: Date, endTime: Date, domain: string) {
// 	const url = `http://${domain}/api/trpc/user/getCost?domain=${domain}&startTime=${startTime}&endTime=${endTime}`;
// 	const resp = await axios.get(url);
// 	return resp.data;
// }

export function parseQuotaValue(
	input: string,
	type: 'cpu' | 'memory' | 'storage'
): QuotaResult {
	let value: number;
	let unit: CpuEnum | SizeEnum;

	if (type === 'cpu') {
		unit = 'c';
		if (input.endsWith('c')) {
			value = Number(input.slice(0, -1));
		} else if (input.endsWith('m')) {
			value = Number(input.slice(0, -1));
			value /= 1000;
		} else if (input.endsWith('k')) {
			value = Number(input.slice(0, -1));
			value *= 1000;
		} else {
			value = Number(input);
		}
	} else {
		unit = 'Gi';
		if (input.endsWith('Gi')) {
			value = Number(input.slice(0, -2));
		} else if (input.endsWith('Mi')) {
			value = Number(input.slice(0, -2));
			value /= 1024;
		} else {
			value = Number(input);
		}
	}

	return { value, unit };
}