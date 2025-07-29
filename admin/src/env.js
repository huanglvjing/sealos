// @ts-ignore
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';
// process.env.I18NEXT_DEFAULT_CONFIG_PATH = './next-i18next.config.cjs';
export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    globalCockroachdbURI: z.string().url(),
    regionCockroachdbURI: z.string().url(),
    tokenUrlPrefix: z.string(),
		generateToken: z.string(),
    domain: z.string(),
		regionUid: z.string().uuid(),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    grafanaConsumption: z.string().url(),
    // grafanaIoCluster: z.tuple([z.string(),z.string().url()]),
    // grafanaHzhCluster: z.tuple([z.string(),z.string().url()]),
    // grafanaBjaCluster: z.tuple([z.string(),z.string().url()]),
    // grafanaGzgCluster: z.tuple([z.string(),z.string().url()]),
    // grafanaTopCluster: ,
		regionMongodbURI: z.string(),
		clusterGrafanaKeyList: z.string(),
		clusterGrafanaValList: z.string(),
    grafanaSealosBusiness: z.string().url(),
    grafanaLafBusiness: z.string().url(),
		verifyToken: z.string(),
		adminList: z.string(),
		email_user: z.string(),
		email_password: z.string(),
		email_host: z.string(),
		email_port: z.number(),
		subDomain: z.string(),
		email_test_to: z.string().optional()
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
		generateToken: process.env.generateToken,
    globalCockroachdbURI: process.env.globalCockroachdbURI,
    regionCockroachdbURI: process.env.regionalCockroachdbURI,
    tokenUrlPrefix: process.env.tokenUrlPrefix,
    domain: process.env.domain,
		regionUid: process.env.regionUid,
    NODE_ENV: process.env.NODE_ENV,
    grafanaConsumption: process.env.grafanaConsumption,
		verifyToken: process.env.verifyToken,
		adminList: process.env.adminList,
		subDomain: process.env.subDomain ?? 'admin',
		email_user: process.env.email_user,
		email_password: process.env.email_password,
		email_port: process.env.email_port ? parseInt(process.env.email_port): undefined,
		email_test_to: process.env.email_test_to,
		email_host: process.env.email_host,
		clusterGrafanaKeyList: process.env.clusterGrafnaKeyList,
		clusterGrafanaValList: process.env.clusterGrafnaValList,
    grafanaSealosBusiness: process.env.grafanaSealosBusiness,
    grafanaLafBusiness: process.env.grafanaLafBusiness,
		regionMongodbURI: process.env.regionMongodbURI
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true
});
