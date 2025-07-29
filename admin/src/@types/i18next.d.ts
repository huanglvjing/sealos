import 'i18next';

import announcement from '../../public/locales/en/announcement.json';
import applist from '../../public/locales/en/applist.json';
import common from '../../public/locales/en/common.json';
import homepage from '../../public/locales/en/homepage.json';
import invoice from '../../public/locales/en/invoice.json';
import redemptionCode from '../../public/locales/en/redemptionCode.json';
declare module 'i18next' {
  // eslint-disable-next-line 
  interface CustomTypeOptions {
    returnNull: false;
    defaultNS: ['common', 'applist', 'homepage', "invoice", "announcement", 'redemptionCode' ];
    resources: {
      common: typeof common;
      applist: typeof applist;
			homepage: typeof homepage;
			invoice: typeof invoice;
			announcement: typeof announcement;
			redemptionCode: typeof redemptionCode
		};
		contextSeparator: '__';
		pluralSeparator: '__';
		// resources: typeof resources;
  }
}

