import { Box, Flex, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react';
import { ListIcon } from '@sealos/ui';
import { GetServerSideProps } from 'next';
import { useTranslation, } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Dashboard2Icon from '~/components/common/icon/Dashboard2Icon';
import MonitorIcon from '~/components/common/icon/MonitorIcon';
import AppOverviewPanel from '~/components/overview/AppOverviewPanel';
import CostOverviewPanel from '~/components/overview/CostOverviewPanel';
import RegionCostOverviewPanel from '~/components/overview/grafana/RegionCostOverviewPanel';
import RegionOverviewPanel from '~/components/overview/grafana/RegionOverviewPanel';
import RegionUserOverviewPanel from '~/components/overview/grafana/RegionUserOverviewPanel';
import UserOverviewPanel from '~/components/overview/UserOverviewPanel';

export default function Home() {
  const { t } = useTranslation();
  return (
    <Box h={'full'}>
      <Flex flexDirection="column" h={'full'} bg={'white'} px="24px" py="20px" borderRadius={'8px'}>
        <Flex mb={'8px'} justifyContent={'space-between'}>
          <Text fontSize={'20px'} fontWeight={500}>
            {t("common:home_page")}
          </Text>
        </Flex>
        <Tabs flex={1} display={'flex'} flexDir={'column'} variant={'primary'} h={'full'}>
          <TabList>
            <Tab>
              <Dashboard2Icon boxSize={'18px'} fill={'currentcolor'} /> <Text>{t("homepage:cost_overview")}</Text>
            </Tab>
            <Tab>
              <ListIcon boxSize={'18px'} fill={'currentcolor'}></ListIcon>
              <Text>{t("homepage:statistics_list")}</Text>
            </Tab>
            <Tab>
              <MonitorIcon boxSize={'18px'} fill={'currentcolor'}></MonitorIcon>
              <Text>{t("homepage:cluster_monitoring")}</Text>
            </Tab>
          </TabList>
          <TabPanels mt="12px" flexDirection={'column'} flex={'1'} display={'flex'} h={'full'}>
            <CostOverviewPanel />
            <TabPanel p={'0'} h={'full'} flex={'1'}>
              <Tabs variant={'slide'} width={'auto'} display={'flex'} flexDir={'column'} h={'full'}>
                <TabList>
                  <Tab>{t("homepage:top_100_consuming_users")}</Tab>
                  <Tab>{t("homepage:top_100_app_market_deployments")}</Tab>
                </TabList>
                <TabPanels h={'full'} flex={1} display={'flex'} flexDirection={'column'} p={'0'}>
                  <UserOverviewPanel display={'flex'} h={'full'} flexDirection={'column'} p="0" />
                  <AppOverviewPanel display={'flex'} h={'full'} flexDirection={'column'} />
                </TabPanels>
              </Tabs>
            </TabPanel>
            <TabPanel>
						<Tabs variant={'slide'} width={'auto'} display={'flex'} flexDir={'column'} h={'full'}>
                <TabList>
                  <Tab>{t("homepage:cluster_overview")}</Tab>
                  <Tab>{t("homepage:consumption_statistics")}</Tab>
                  <Tab>{t("homepage:user_count_statistics")}</Tab>
                </TabList>
                <TabPanels h={'full'} flex={1} display={'flex'} flexDirection={'column'} p={'0'}>
									<RegionOverviewPanel></RegionOverviewPanel>
									<RegionCostOverviewPanel></RegionCostOverviewPanel>
									<RegionUserOverviewPanel></RegionUserOverviewPanel>
                </TabPanels>
              </Tabs>
						</TabPanel>
          </TabPanels>
        </Tabs>
      </Flex>
    </Box>
  );
}

export const getServerSideProps: GetServerSideProps = async ({locale}) => {
  return {
    props: {
     ...(await serverSideTranslations(locale ?? 'zh', ['common',"applist", "homepage"])),
    },
  };
};
