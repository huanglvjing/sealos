/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { middlewareMarker, MiddlewareResult } from '@trpc/server/unstable-core-do-not-import';
import jwt, { JwtPayload } from 'jsonwebtoken';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { regionSchema } from '~/@types/region';
import { env } from '~/env';
import { apiFactory } from '~/utils/apiFactory';
import { globalPrisma, regionMongoClient, regionPrisma } from '../db';
import { newK8sClient } from '../db/init';
/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */

type CreateContextOptions = Record<string, never>;

/**
 * This helper generates the "internals" for a tRPC context. If you need to use it, you can export
 * it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 *
 * @see https://create.t3.gg/en/usage/trpc#-serverapitrpcts
 */

export const createInnerTRPCContext = (_opts: { auth: string | undefined, req?: CreateNextContextOptions['req'] }) => {

	return {
		db: {
			globalPrisma: globalPrisma,
			regionPrisma: regionPrisma,
			regionMongoClient: regionMongoClient
		},
		email: {
			testTo: env.email_test_to
		},
		k8s: {
			k8sClient: newK8sClient(),
			tokenUrlPrefix: env.tokenUrlPrefix ?? '',
			domain: env.domain ?? '',
			generateToken: env.generateToken ?? '',
			verifyToken: env.verifyToken ?? ''
		},
		grafana: {
			grafanaConsumption: env.grafanaConsumption ?? '',
			grafanaSealosBusiness: env.grafanaSealosBusiness ?? '',
			grafanaLafBusiness: env.grafanaLafBusiness ?? '',
			clusterGrafanaKeyList: env.clusterGrafanaKeyList,
			clusterGrafanaValList: env.clusterGrafanaValList
		},
		httpclient: _opts
	};
};

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = (_opts?: CreateNextContextOptions) => {
	return createInnerTRPCContext({
		auth: _opts?.req.headers.authorization,
		req: _opts?.req
	});
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */

export const t = initTRPC.context<typeof createTRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error, input }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError: error.cause instanceof ZodError ? error.cause.flatten() : null
			}
		};
	}
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
	const start = Date.now();

	if (t._config.isDev) {
		// artificial delay in dev
		const waitMs = Math.floor(Math.random() * 400) + 100;
		await new Promise((resolve) => setTimeout(resolve, waitMs));
	}

	const result = await next();

	const end = Date.now();
	console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

	return result; t
});

const tokenMiddleware = t.middleware(async ({ ctx, next }) => {

	const result = await verifyToken<
	{
			userUid: string,
			userCrUid: string,
			userCrName: string,
			regionUid: string,
			userId: string,
			workspaceId: string,
			workspaceUid: string,
	}>(
		ctx.httpclient.auth?.split(' ')[1] ?? '',
		env.verifyToken
	);
	
	if (!result.valid  || !env.adminList.split(',').includes(result.payload.userId)) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'Error verifying token'
		})
	}
	return next();
});

function verifyToken<T extends JwtPayload>(
	token: string,
	verifyToken: string
) {
	return new Promise<{ valid: false } | { valid: true, payload: T }>((res, rej) => {
		jwt.verify(token, verifyToken, (err, decodedToken) => {
			if (err) {
				// console('Error verifying token:', err);
				return res({
					valid: false,
				} as const);
			}
			return res({
				valid: true,
				payload: decodedToken as T
			} as const);
		});
	});
}

export const otherRegionMiddlewareFactory = (qT: 'mutation' | 'query', redirect?: string)=>t.middleware(async ({input, meta, next, ctx,getRawInput , path, ...opts})=>{
	const result = regionSchema.safeParse(input)
	const regionUid = result.data?.regionUid
	if (!result.success || !regionUid
		||  regionUid === env.regionUid
	) {
		return next()
	}
	const region = await ctx.db.globalPrisma.region.findUnique({
		where: {
			uid: regionUid
		}
	})
	if (!region) {
		return next()
	}
	const regionDomain = env.NODE_ENV === 'development' ? '127.0.0.1:3001' : `${env.subDomain}.` + region.domain
	// const data = 
	const url = `http://${regionDomain}/api/trpc`;

	const authorization = ctx.httpclient.req?.headers.authorization!;
	const client = apiFactory(url, () => authorization);
	// @ts-ignore
	env.NODE_ENV === 'development' && (input.regionUid = undefined)
	const otherRegionResponse = await client[qT](redirect ?? path, input);
	const middlewareResult: MiddlewareResult<any> = {
		ok: true,
		data: otherRegionResponse,
		marker: middlewareMarker
	}
	return middlewareResult
})

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const privateProcedure = t.procedure
	.use(timingMiddleware)
	.use(tokenMiddleware)

export const publicProcedure = t.procedure;

