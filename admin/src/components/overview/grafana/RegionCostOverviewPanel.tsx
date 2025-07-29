import { Box, Link, TabPanel, TabPanelProps } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { GrafanaEnum } from '~/@types/grafana';
import ShareIcon from '~/components/common/icon/ShareIcon';
import { api } from '~/utils/api';

export default function RegionCostOverviewPanel(props: TabPanelProps) {
	const {t} = useTranslation()
	const urlResult = api.user.getGrafanaOther.useQuery({
		type: GrafanaEnum.Values.consumption
	})
	const url = urlResult.data
	return (
		<TabPanel position={'relative'} h={'full'}{...props}>
			<Link color={'brightBlue.600'} fontSize={'14px'} fontWeight={'500'} alignItems={'center'} display={'flex'}
				position={'absolute'}
				href={url}
				target='_blank'
				ml={'auto'}
				top={'-40px'}
				right={'0'}
			>
				{t("common:grafana_link_redirect")}
				 <ShareIcon mx={'4px'} boxSize={'18px'} fill={'currentcolor'} href={url} />
			</Link>
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
		</TabPanel>)
}