import { stringify } from 'csv-stringify';
import { addMonths } from 'date-fns';
import { customAlphabet } from 'nanoid';
import { Prisma } from 'prisma/generated/global-client';
import { z } from 'zod';
import { PaginationSchema } from '~/@types/page';
import { CodeStatusEnum } from '~/@types/redemptionCode';
import { createTRPCRouter, privateProcedure } from '~/server/api/trpc';
import { TRPCError } from '@trpc/server';

// 新增兑换码类型枚举
const RechargeCodeTypeEnum = z.enum([
  'TEST_RECHARGE',
  'COMPENSATION_RECHARGE',
  'ACTIVITY_RECHARGE',
  'CORPORATE_RECHARGE'
]);

const QuerySchema = z.object({
  status: CodeStatusEnum.default('all'),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  id: z.string().optional(),
  code: z.string().optional(),
  comment: z.string().optional(),
  rechargeType: RechargeCodeTypeEnum.optional() // 新增兑换码类型查询
});

const generateCodeSchema = z.object({
  count: z.number().min(1).max(100),
  comment: z.string().optional(),
  endTime: z.date().default(addMonths(new Date(), 1)),
  amount: z.bigint(),
  prefix: z.string().default('ld-'),
  rechargeType: RechargeCodeTypeEnum // 新增必选的兑换码类型
});

const generateCode = (prefix: string) => {
  // generate the random code
  const length = 24 - prefix.length;
  const gen = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', length);
  const code = `${prefix}${gen()}`;
  return code;
};

export const codeRouter = createTRPCRouter({
  getCodeList: privateProcedure
    .input(QuerySchema.merge(PaginationSchema))
    .query(async ({ ctx, input }) => {
      const { pageIndex, pageSize, status } = input;
      const offset = pageIndex * pageSize;
      const where: Prisma.GiftCodeFindManyArgs['where'] = {};

      if (input.id) {
        where.id = input.id;
      }
      if (status !== 'all') {
        where.used = status === 'used';
      }
      if (input.startTime || input.endTime) {
        where.createdAt = {
          ...(input.startTime ? { gte: input.startTime } : {}),
          ...(input.endTime ? { lte: input.endTime } : {})
        };
      }
      if (input.code) {
        where.code = {
          contains: input.code
        };
      }
      if (input.comment) {
        where.comment = {
          contains: input.comment
        };
      }
      // 新增兑换码类型过滤
      if (input.rechargeType) {
        where.giftCodeCreation = {
          rechargeType: input.rechargeType
        };
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
              id: true
            }
          },
          // 新增：包含创建记录和创建人信息
          giftCodeCreation: {
            include: {
              createdByUser: {
                select: {
                  id: true,
                  nickname: true,
                  realNameInfo: {
                    // 新增
                    select: {
                      realName: true
                    }
                  }
                }
              }
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

  generateCode: privateProcedure.input(generateCodeSchema).mutation(async ({ ctx, input }) => {
    const { count, comment, amount, prefix, rechargeType } = input;

    // 从context中获取当前用户信息
    const currentUserId = ctx.user.userId;
    const currentUser = await ctx.db.globalPrisma.user.findUnique({
      where: { id: currentUserId }
    });

    if (!currentUser) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Current user not found'
      });
    }

    // 生成兑换码
    const codes = Array(count)
      .fill(0)
      .map(() => generateCode(prefix));

    // 使用事务确保数据一致性
    const result = await ctx.db.globalPrisma.$transaction(async (prisma) => {
      const insertedRecords = await prisma.giftCode.createManyAndReturn({
        data: codes.map((code) => ({
          code,
          comment,
          creditAmount: amount * BigInt(1_000_000),
          expiredAt: input.endTime
        }))
      });

      // 为每个兑换码创建创建记录
      await prisma.giftCodeCreation.createMany({
        data: insertedRecords.map((record) => ({
          giftCodeId: record.id,
          createdByUserUid: currentUser.uid,
          rechargeType
        }))
      });

      return insertedRecords;
    });

    return result;
  }),

  downloadCodeList: privateProcedure
    .input(QuerySchema.default({}))
    .mutation(async ({ ctx, input }) => {
      const where: Prisma.GiftCodeFindManyArgs['where'] = {};

      if (input.id) {
        where.id = input.id;
      }
      if (input.status !== 'all') {
        where.used = input.status === 'used';
      }
      if (input.startTime || input.endTime) {
        where.createdAt = {
          ...(input.startTime ? { gte: input.startTime } : {}),
          ...(input.endTime ? { lte: input.endTime } : {})
        };
      }
      if (input.code) {
        where.code = {
          contains: input.code
        };
      }
      if (input.comment) {
        where.comment = {
          contains: input.comment
        };
      }
      if (input.rechargeType) {
        where.giftCodeCreation = {
          rechargeType: input.rechargeType
        };
      }

      const result = await ctx.db.globalPrisma.giftCode.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        where,
        include: {
          giftCodeCreation: {
            include: {
              createdByUser: {
                select: {
                  id: true,
                  nickname: true,
                  realNameInfo: {
                    // 新增
                    select: {
                      realName: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // 转换数据格式，包含创建人和兑换码类型信息
      const exportData = result.map((item) => ({
        ...item,
        createdBy:
          item.giftCodeCreation?.createdByUser?.realNameInfo?.realName ??
          item.giftCodeCreation?.createdByUser?.nickname ??
          '', // 优先显示真实姓名，没有则显示昵称
        createdById: item.giftCodeCreation?.createdByUser?.id ?? '',
        rechargeType: item.giftCodeCreation?.rechargeType ?? ''
      }));

      const data = await new Promise<string>((resolve, reject) =>
        stringify(
          exportData,
          {
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
              createdBy: 'Created By',
              createdById: 'Created By ID',
              rechargeType: 'Recharge Type'
            },
            cast: {
              date: (v) => v?.toISOString() || '',
              bigint: (v, ctx) =>
                ctx.column === 'creditAmount' ? (v / BigInt(1_000_000)).toString() : v.toString(),
              boolean: (v) => (v ? 'true' : 'false'),
              number: (v) => v.toString()
            }
          },
          (err, output) => {
            if (err) {
              return reject(err);
            }
            return resolve(output);
          }
        )
      );

      return data;
    }),

  // 新增：兑换码使用逻辑，处理用户类型自动变更
  useGiftCode: privateProcedure
    .input(
      z.object({
        code: z.string(),
        userId: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { code, userId } = input;

      const result = await ctx.db.globalPrisma.$transaction(async (prisma) => {
        // 查找兑换码
        const giftCode = await prisma.giftCode.findUnique({
          where: { code },
          include: {
            giftCodeCreation: true
          }
        });

        if (!giftCode) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Gift code not found'
          });
        }

        if (giftCode.used) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Gift code already used'
          });
        }

        if (giftCode.expiredAt && giftCode.expiredAt < new Date()) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Gift code expired'
          });
        }

        // 查找用户
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { userAccountType: true, account: true }
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found'
          });
        }

        // 如果是测试充值兑换码，将用户类型变更为内部员工
        if (giftCode.giftCodeCreation?.rechargeType === 'TEST_RECHARGE') {
          if (user.userAccountType) {
            await prisma.userAccountType.update({
              where: { userUid: user.uid },
              data: { userType: 'INTERNAL_EMPLOYEE' }
            });
          } else {
            await prisma.userAccountType.create({
              data: {
                userUid: user.uid,
                userType: 'INTERNAL_EMPLOYEE',
                productSeries: []
              }
            });
          }
        }

        // 标记兑换码为已使用
        await prisma.giftCode.update({
          where: { id: giftCode.id },
          data: {
            used: true,
            usedBy: user.uid,
            usedAt: new Date()
          }
        });

        // 增加用户余额
        if (user.account) {
          await prisma.account.update({
            where: { userUid: user.uid },
            data: {
              balance: {
                increment: giftCode.creditAmount
              }
            }
          });
        }

        return { success: true, amount: giftCode.creditAmount };
      });

      return result;
    })
});
