import { appstoreRouter } from '~/server/api/routers/appstore';
import { baseRouter } from '~/server/api/routers/base';
import { userRouter } from '~/server/api/routers/user';
import { createCallerFactory, createTRPCRouter } from '~/server/api/trpc';
import { announcementRouter } from './routers/announcement';
import { codeRouter } from './routers/code';
import { domainRouter } from './routers/domain';
import { healthRouter } from './routers/health';
import { invoiceRouter } from './routers/invoice';
import { refundRouter } from './routers/refund';
import { corporatePaymentRouter } from './routers/payRecord';
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  base: baseRouter,
  user: userRouter,
  appstore: appstoreRouter,
  domain: domainRouter,
  invoice: invoiceRouter,
  health: healthRouter,
  announcement: announcementRouter,
  refund: refundRouter,
  corporatePayment: corporatePaymentRouter,
  code: codeRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
