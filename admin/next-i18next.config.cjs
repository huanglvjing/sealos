// process.env.I18NEXT_DEFAULT_CONFIG_PATH = './next-i18next.config.cjs'
/**
 * @type {import('next-i18next').UserConfig}
 */
module.exports = {
  i18n: {
    defaultLocale: 'zh',
    locales: ['en', 'zh'],
    localeDetection: false,
		
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development'
};
