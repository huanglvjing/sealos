import { env } from 'process';
export function register() {
	env.I18NEXT_DEFAULT_CONFIG_PATH = './next-i18next.config.cjs';
}
