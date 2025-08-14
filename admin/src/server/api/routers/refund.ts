import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createTRPCRouter, privateProcedure } from '~/server/api/trpc';

const refundFormSchema = z.object({
  Id: z.string().min(1, '支付ID不能为空'),
  refundAmount: z.number().positive('退款金额必须大于0'),
  deductAmount: z.number().min(0, '扣除金额不能为负数'),
  refundReason: z.string().min(1, '退款原因不能为空')
});

// 环境变量配置
const JWT_SECRET = process.env.verifyToken;
const REFUND_API_URL = process.env.REFUND_API_URL;

const TOKEN_PAYLOAD = {
  requester: 'sealos-admin',
  userUid: '00000000-0000-0000-0000-000000000000',
  regionUid: '41022d5a-18a1-4feb-a9cc-96b593f94aca'
};

const generateToken = (): string => {
  if (!JWT_SECRET) {
    throw new Error('verifyToken 环境变量未设置');
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60;

  const payload = {
    ...TOKEN_PAYLOAD,
    nonce,
    iat: Math.floor(Date.now() / 1000),
    exp: expirationTime
  };

  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
};

export const refundRouter = createTRPCRouter({
  submitRefund: privateProcedure.input(refundFormSchema).mutation(async ({ ctx, input }) => {
    try {
      // 检查必要的环境变量
      if (!REFUND_API_URL) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'REFUND_API_URL 环境变量未设置'
        });
      }

      // 动态生成token
      const token = generateToken();

      const response = await fetch(REFUND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          Id: input.Id,
          refundAmount: input.refundAmount,
          deductAmount: input.deductAmount,
          refundReason: input.refundReason
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('退款API错误:', errorText);

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `退款申请失败: ${response.status} ${response.statusText}`
        });
      }

      const result = await response.json();

      return {
        success: true,
        message: '退款申请提交成功',
        data: result
      };
    } catch (error) {
      console.error('退款接口调用失败:', error);

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : '网络错误,请重试'
      });
    }
  })
});
