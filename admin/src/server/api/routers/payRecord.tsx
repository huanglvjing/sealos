import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createTRPCRouter, privateProcedure } from '~/server/api/trpc';

const corporatePaymentSchema = z.object({
  UserUid: z.string().min(1, '用户ID不能为空'),
  receiptSerialNumber: z.string().min(1, '流水号不能为空'),
  payerName: z.string().min(1, '商户名称不能为空'),
  paymentAmount: z.number().positive('支付金额必须大于0'),
  giftAmount: z.number().min(0, '赠送额度不能为负数'),
  payDate: z.string().optional(),
  CreationDate: z.string().optional()
});

const JWT_SECRET = process.env.verifyToken;
const PAY_RECORD_API_URL = process.env.payRecord_API_URL;

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

export const corporatePaymentRouter = createTRPCRouter({
  submitCorporatePayment: privateProcedure
    .input(corporatePaymentSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        if (!PAY_RECORD_API_URL) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'payRecord_API_URL 环境变量未设置'
          });
        }

        const token = generateToken();

        const requestBody: any = {
          UserUid: input.UserUid,
          receiptSerialNumber: input.receiptSerialNumber,
          payerName: input.payerName,
          paymentAmount: input.paymentAmount,
          giftAmount: input.giftAmount
        };

        if (input.payDate && input.payDate.trim() !== '') {
          requestBody.payDate = input.payDate;
        }

        if (input.CreationDate && input.CreationDate.trim() !== '') {
          requestBody.CreationDate = input.CreationDate;
        }

        console.log('发送的请求体:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(PAY_RECORD_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();
        console.log('API响应体:', responseText);

        // 响应处理
        if (!response.ok) {
          console.error('对公支付API错误:', responseText);

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `对公支付申请失败: ${response.status} ${response.statusText}`
          });
        }

        const result = JSON.parse(responseText);

        return {
          success: true,
          message: '对公支付申请提交成功',
          data: result
        };
      } catch (error) {
        console.error('对公支付接口调用失败:', error);

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
