import { Button, Flex, Text } from '@chakra-ui/react';
import { LeftArrowIcon } from '@sealos/ui';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
// import { useRouter } from ;
import { z } from 'zod';
import BaseInfo from '~/components/user/detail/BaseInfo';
import CostInfo from '~/components/user/detail/CostInfo';
import QuotaInfo from '~/components/user/detail/QuotaInfo';

export default function Page() {
  const router = useRouter();
  const userIdReturn = z.string().nullish().safeParse(router.query.userId);
  useEffect(() => {
    if (!router.isReady) return;
    if (!userIdReturn.success || !userIdReturn.data) {
      router.push('/user');
      return;
    }
  }, [router, userIdReturn.data, userIdReturn.success, router.isReady]);
  const { t } = useTranslation();
  return (
    <Flex
      flexDirection="column"
      h={'full'}
      bg={'white'}
      px="24px"
      py="20px"
      borderRadius={'8px'}
      gap={'24px'}
    >
      <Flex>
        <Button
          variant={'unstyled'}
          onClick={() => {
            router.push('/user');
          }}
					p={'0'}
					h={'auto'}
					gap={'8px'}
          display={'flex'}
        >
          <LeftArrowIcon boxSize={'20px'} color={'grayModern.600'} />
          <Text color={'grayModern.600'} fontWeight={500} fontSize={'14px'}>
            {t('common:back')}
          </Text>
        </Button>
      </Flex>
      <BaseInfo id={userIdReturn.data ?? ''} />
      <CostInfo id={userIdReturn.data ?? ''} />
      <QuotaInfo id={userIdReturn.data ?? ''} h={0} flex={1} />
    </Flex>
  );
}
export const getServerSideProps: GetServerSideProps = async ({locale}) => {
  return {
    props: {
     ...(await serverSideTranslations(locale ?? 'zh', ['common',"applist"])),
    },
  };
};