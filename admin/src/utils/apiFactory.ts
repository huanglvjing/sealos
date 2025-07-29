import {
	createTRPCUntypedClient,
	httpBatchLink,
	HTTPHeaders,
	loggerLink
} from '@trpc/client';
import superjson from 'superjson';
export function apiFactory(url: string, getAuthorization: () => string) {
  return createTRPCUntypedClient({
    links: [
      loggerLink({
        enabled: (opts) =>
          process.env.NODE_ENV === 'development' ||
          (opts.direction === 'down' && opts.result instanceof Error)
      }),
      httpBatchLink({
        /**
         * Transformer used for data de-serialization from the server.
         *
         * @see https://trpc.io/docs/data-transformers
         */
        transformer: superjson,
        url,
        headers() {
          const headers: HTTPHeaders = {};
          headers.Authorization = getAuthorization();
          return headers;
        }
      })
    ]
  });
}
