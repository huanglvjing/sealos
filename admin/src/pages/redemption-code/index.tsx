import { Box, Flex, Tab, TabList, TabPanels, Tabs, Text } from '@chakra-ui/react';
import { SettingIcon } from '@sealos/ui';
import { GetServerSideProps } from 'next';
import { useTranslation, } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import AddBoxIcon from '~/components/common/icon/AddBoxIcon';
import GenerationPanel from '~/components/redemption/GenerationPanel';
import ManagementPanel from '~/components/redemption/ManagementPanel';
export default function Home() {
  const { t } = useTranslation();
  return (
    <Box h={'full'}>
      <Flex flexDirection="column" h={'full'} bg={'white'} px="24px" py="20px" borderRadius={'8px'}>
        <Flex mb={'8px'} justifyContent={'space-between'}>
          <Text fontSize={'20px'} fontWeight={500}>
            {t("common:redemption_code_management")}
          </Text>
        </Flex>
        <Tabs flex={1} display={'flex'} flexDir={'column'} variant={'primary'} h={'full'}>
          <TabList>
            <Tab>
              <AddBoxIcon boxSize={'18px'} fill={'currentcolor'} />
              <Text>{t("redemptionCode:code_generation")}</Text>
            </Tab>
            <Tab>
              <SettingIcon boxSize={'18px'} fill={'currentcolor'} />
              <Text>{t("redemptionCode:code_management")}</Text>
            </Tab>
          </TabList>
          <TabPanels flexDirection={'column'} flex={'1'} display={'flex'} h={'full'} mt={'0'}>
						<GenerationPanel />
						<ManagementPanel />
          </TabPanels>
        </Tabs>
      </Flex>
    </Box>
  );
}

export const getServerSideProps: GetServerSideProps = async ({locale}) => {
  return {
    props: {
     ...(await serverSideTranslations(locale ?? 'zh', ['common',"applist", "homepage", "announcement", "redemptionCode"])),
    },
  };
};
