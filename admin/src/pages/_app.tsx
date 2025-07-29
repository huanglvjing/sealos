import { ChakraProvider } from '@chakra-ui/react';
import { appWithTranslation } from 'next-i18next';
import { type AppType } from 'next/app';
import router from 'next/router';
import { useEffect } from 'react';
import { EVENT_NAME } from 'sealos-desktop-sdk';
import { createSealosApp, sealosApp } from 'sealos-desktop-sdk/app';
import Layout from '~/layout';
import useSessionStore from '~/stores/session';
import { theme } from '~/styles';
import '~/styles/globals.css';
import { api } from '~/utils/api';

const MyApp: AppType = ({ Component, pageProps }) => {
  const { setSession } = useSessionStore();
  useEffect(() => {
    return createSealosApp();
  }, []);

  useEffect(() => {
    const changeI18n = (data: { currentLanguage: string }) => {
      router.replace(router.basePath, router.asPath, {
        locale: data.currentLanguage
      });
    };

    (async () => {
      try {
      const lang = await sealosApp.getLanguage();
      changeI18n({
        currentLanguage: lang.lng
      });
      } catch (error) {
        changeI18n({
          currentLanguage: 'zh'
        });
      }
    })();

    sealosApp.addAppEventListen(EVENT_NAME.CHANGE_I18N, changeI18n);
    return () => {
      sealosApp.removeAppEventListen(EVENT_NAME.CHANGE_I18N);
    };
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        const result = await sealosApp.getSession();
        setSession(result);
      } catch (error) {}
    };
    initApp();
  }, []);
  return (
    <ChakraProvider theme={theme}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ChakraProvider>
  );
};

export default api.withTRPC(appWithTranslation(MyApp));
