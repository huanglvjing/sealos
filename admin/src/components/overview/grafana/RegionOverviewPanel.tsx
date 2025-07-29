import { Box, Flex, Link, TabPanel, TabPanelProps, Text } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import ShareIcon from '~/components/common/icon/ShareIcon';
import RegionMenu from '~/components/common/menu/RegionMenu';
import { api, RouterOutputs } from '~/utils/api';

export default function RegionOverviewPanel(props: TabPanelProps) {
	const [region, setRegion] = useState<RouterOutputs['base']['getRegionList'][number] | undefined>(undefined)
	const {t} = useTranslation();
	const urlResult = api.user.getGrafanaCluster.useQuery({
		domain: region?.domain,
	})
	const url = urlResult.data
  return (
    <TabPanel h={'full'}{...props}>
			<Flex justifyContent={'space-between'} mb={'12px'}>
        <Flex gap={'32px'} align={'center'} >
          <Text fontSize={'12px'} fontWeight={'500'}>
            {t('common:region')}
          </Text>
          <RegionMenu region={region} onUpdateRegion={setRegion} isDisabled={false} width="240px" />
        </Flex>
				<Link color={'brightBlue.600'} fontSize={'14px'} fontWeight={'500'} alignItems={'center'} display={'flex'}
					href={url}
					target='_blank'
				>
				{t('common:grafana_link_redirect')} <ShareIcon mx={'4px'} boxSize={'18px'} fill={'currentcolor'} href={url}/>
				</Link>
				</Flex>
				<Box overflow={'auto'} flex={'1'} h={0} w={'full'} 
						marginBottom='14px'>
				<iframe
				style={
					{
						flex: '1 1 auto',
						height: '580px',
						width: '100%',
						borderRadius: '8px',
					}
				}
				src={url}
				></iframe>
				</Box>
    </TabPanel>
  );
}