/**
 * This is the client-side entrypoint for your tRPC API. It is used to create the `api` object which
 * contains the Next.js App-wrapper, as well as your type-safe React Query hooks.
 *
 * We also create a few inference helpers for input and output types.
 */
import {
  httpBatchLink,
  HTTPHeaders,
  httpLink,
  isFormData,
  isNonJsonSerializable,
  loggerLink,
  splitLink
} from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';
import { defaultTransformer } from '@trpc/server/unstable-core-do-not-import';
import superjson from 'superjson';
import { type AppRouter } from '~/server/api/root';
import useSessionStore from '~/stores/session';
const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};
/** A set of type-safe react-query hooks for your tRPC API. */

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export const api = createTRPCNext<AppRouter>({
  config({ ctx }) {
    return {
      /**
       * Links used to determine request flow from client to server.
       *
       * @see https://trpc.io/docs/links
       */
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error)
        }),
        splitLink({
          condition({ input }) {
            // const { nextType } = op.direction === 'up'? op : op.op;
            // return nextType ==='subscription';
            console.log();
            // check for `@trpc/server/http` header
            const is = isFormData(input);
            console.log('opis!!!', is);
            console.log('nojson', isNonJsonSerializable(input));
            return is;
          },
          true: httpLink({
            url: `${getBaseUrl()}/api/trpc`,
            transformer: defaultTransformer,
            headers() {
              const req = ctx?.req;
              console.log(req?.headers);
              const headers: HTTPHeaders = {};
              if (!req?.headers) {
                headers.Authorization = `Bearer ${useSessionStore.getState().getSession().token}`;
              } else {
                headers.Authorization = req.headers.authorization;
              }
              return headers;
            }
          }),
          false: httpBatchLink({
            /**
             * Transformer used for data de-serialization from the server.
             *
             * @see https://trpc.io/docs/data-transformers
             */
            transformer: superjson,
            url: `${getBaseUrl()}/api/trpc`,
            headers() {
              const req = ctx?.req;
              console.log(req?.headers);
              const headers: HTTPHeaders = {};
              if (!req?.headers) {
                headers.Authorization = `Bearer ${useSessionStore.getState().getSession().token}`;
                console.log(useSessionStore.getState().getSession().token);
              } else {
                headers.Authorization = req.headers.authorization;
              }
              return headers;
            }
          })
        })
      ]
    };
  },
  /**
   * Whether tRPC should await queries when server rendering pages.
   *
   * @see https://trpc.io/docs/nextjs#ssr-boolean-default-false
   */
  ssr: false,
  transformer: superjson
});
