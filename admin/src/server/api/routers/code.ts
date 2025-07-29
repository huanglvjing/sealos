import { stringify } from 'csv-stringify';
import { addMonths } from 'date-fns';
import { customAlphabet } from 'nanoid';
import { Prisma } from 'prisma/generated/global-client';
import { z } from "zod";
import { PaginationSchema } from '~/@types/page';
import { CodeStatusEnum } from '~/@types/redemptionCode';
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
const QuerySchema = z.object({
	status: CodeStatusEnum.default('all'),
	startTime: z.date().optional(),
	endTime: z.date().optional(),
	id: z.string().optional(),
	code: z.string().optional(),
	comment: z.string().optional(),
})
const generateCodeSchema = z.object(
	{
		count: z.number().min(1).max(100),
		comment: z.string().optional(),
		endTime: z.date().default(addMonths(new Date(), 1),),
		amount: z.bigint(),
		prefix: z.string().default('ld-')
	}
)
const generateCode = (prefix: string) => {
	// generate the random code
	const length = 24 - prefix.length
	const gen = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', length)
	const code = `${prefix}${gen()}`
	return code
}
export const codeRouter = createTRPCRouter({
	getCodeList: privateProcedure
		.input(
			QuerySchema.merge(PaginationSchema)
		)
		.query(async ({ ctx, input }) => {
			const { pageIndex, pageSize, status } = input;
			const offset = pageIndex * pageSize;
			const where: Prisma.GiftCodeFindManyArgs['where'] = {}
			if (input.id) {
				where.id = input.id
			}
			if (status !== 'all') {
				where.used = status === 'used'
			}
			if (input.startTime || input.endTime) {
				where.createdAt = {
					...(input.startTime ? { gte: input.startTime } : {}),
					...(input.endTime ? { lte: input.endTime } : {})
				}
			}
			if (input.code) {
				where.code = {
					contains: input.code
				}
			}

			if (input.comment) {
				where.comment = {
					contains: input.comment
				}
			}
			const result = await ctx.db.globalPrisma.giftCode.findMany({
				take: pageSize,
				skip: offset,
				orderBy: {
					createdAt: 'desc'
				},
				where,
				include: {
					user: {
						select: {
							id: true,
						}
					}
				}
			});
			const count = await ctx.db.globalPrisma.giftCode.count({
				where
			});
			const totalPages = Math.ceil(count / pageSize);
			return {
				list: result,
				pageIndex,
				pageSize,
				totalItems: count,
				totalPages
			};
		}),
	generateCode: privateProcedure
		.input(
			generateCodeSchema
		).mutation(async ({ ctx, input }) => {
			const { count, comment, amount, prefix } = input

			const insertedRecords = await ctx.db.globalPrisma.giftCode.createManyAndReturn({
				data: Array(count).fill(0).map(_ => ({
					code: generateCode(prefix),
					comment,
					creditAmount: amount * BigInt(1_000_000)
				}))
			});
			return insertedRecords;
		}),
	downloadCodeList: privateProcedure
		.input(
			QuerySchema.default({})
		)
		.mutation(async ({ ctx, input }) => {
			const where: Prisma.GiftCodeFindManyArgs['where'] = {}
			if (input.id) {
				where.id = input.id
			}
			if (input.status !== 'all') {
				where.used = input.status === 'used'
			}
			if (input.startTime || input.endTime) {
				where.createdAt = {
					...(input.startTime ? { gte: input.startTime } : {}),
					...(input.endTime ? { lte: input.endTime } : {})
				}
			}
			if (input.code) {
				where.code = {
					contains: input.code
				}
			}

			if (input.comment) {
				where.comment = {
					contains: input.comment
				}
			}
			const result = await ctx.db.globalPrisma.giftCode.findMany({
				orderBy: {
					createdAt: 'desc'
				},
				where,
			});
			const data = await new Promise<string>((resolve, reject) => stringify(result, {
				header: true,
				columns: {
					code: 'Code',
					id: 'Id',
					used: 'Used',
					creditAmount: 'Credit Amount',
					createdAt: 'Created At',
					expiredAt: 'Expired At',
					usedAt: 'Used At',
					usedBy: 'Used By',
					comment: 'Comment',
				},
				cast: {
					date: (v) => v.toISOString(),
					bigint: (v, ctx) => ctx.column === 'creditAmount' ? (v / BigInt(1_000_000)).toString() : v.toString(),
					boolean: (v) => v ? 'true' : 'false',
					number: (v) => v.toString(),
				},
			}, (err, output) => {
				if (err) {
					return reject(err)
				}
				return resolve(output)
			})
			)
			return data
		})
})