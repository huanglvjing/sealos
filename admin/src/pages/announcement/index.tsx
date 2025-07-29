import { Box, Flex, Tab, TabList, TabPanels, Tabs, Text } from '@chakra-ui/react';
import { GetServerSideProps } from 'next';
import { useTranslation, } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import RecordPannel from '~/components/announcement/RecordPannel';
import SendPanel from '~/components/announcement/SendPannel';
import RestoreIcon from '~/components/common/icon/RestoreIcon';
import RocketIcon from '~/components/common/icon/RocketIcon';

export default function Home() {
  const { t } = useTranslation();
  return (
    <Box h={'full'}>
      <Flex flexDirection="column" h={'full'} bg={'white'} px="24px" py="20px" borderRadius={'8px'}>
        <Flex mb={'8px'} justifyContent={'space-between'}>
          <Text fontSize={'20px'} fontWeight={500}>
            {t("common:announcement_management")}
          </Text>
        </Flex>
        <Tabs flex={1} display={'flex'} flexDir={'column'} variant={'primary'} h={'full'}>
          <TabList>
            <Tab>
              <RocketIcon boxSize={'18px'} fill={'currentcolor'} />
              <Text>{t("announcement:send_announcement")}</Text>
            </Tab>
            <Tab>
              <RestoreIcon boxSize={'18px'} fill={'currentcolor'} />
              <Text>{t("announcement:announcement_log")}</Text>
            </Tab>
          </TabList>
          <TabPanels flexDirection={'column'} flex={'1'} display={'flex'} h={'full'} mt={'0'}>
						<SendPanel />
						<RecordPannel />
          </TabPanels>
        </Tabs>
      </Flex>
    </Box>
  );
}

export const getServerSideProps: GetServerSideProps = async ({locale}) => {
  return {
    props: {
     ...(await serverSideTranslations(locale ?? 'zh', ['common',"applist", "homepage", "announcement"])),
    },
  };
};
