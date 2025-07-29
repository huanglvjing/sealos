import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from './next-i18next.config.cjs';
const { i18n} = pkg;

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import('./src/env.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** @type {import("next").NextConfig} */
const config = {
	env: {
		I18NEXT_DEFAULT_CONFIG_PATH: './next-i18next.config.cjs'
	},
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
		instrumentationHook: true
  },
  /**
   * If you are using `appDir` then you must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n,
  transpilePackages: ['geist', 'echarts', 'sealos@ui']
};

export default config;
