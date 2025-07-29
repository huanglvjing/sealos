import { Flex, FlexProps, Icon, Text } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
// import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import AnnouncementIcon from '~/components/common/icon/AnnouncementIcon';
import CouponCodeIcon from '~/components/common/icon/CouponCodeIcon';
import DashboardIcon from '~/components/common/icon/DashboardIcon';
import GlobalIcon from '~/components/common/icon/GlobalIcon';
import ReciptIcon from '~/components/common/icon/ReceiptIcon';
import UsersIcon from '~/components/common/icon/UsersIcon';
// import useEnvStore from '@/stores/env';
type Menu = {
	id: string;
	url: string;
	icon: typeof Icon;
	display: boolean;
	value: string;
	children?: Menu[];
};

const SideBarItem = ({
	url,
	value,
	...props
}: { value: string; icon: typeof Icon; url: string } & FlexProps) => {
	const router = useRouter();
	const isActive = url === '/' ? router.route === '/' : router.route.startsWith(url);
	return (
		<Flex
			alignItems={'center'}
			onClick={() => {
				router.push(url);
			}}

			as="button"
			fontWeight={500}
			fontSize={'14px'}
			w={'240px'}
			color={isActive ? 'grayModern.900' : 'grayModern.500'}
			bgColor={isActive ? '#9699B426' : ''}
			_hover={
				!isActive ? {
					bgColor: '#9699B40D',
					color: 'grayModern.600'
				} : {}
			}

			borderRadius={'4px'}
			py={'9px'}
			px={'12px'}
		>
			<Flex gap={'6px'} align={'center'}>
				{<props.icon boxSize={'18px'}
					fill={'currentcolor'}
				/>}
				<Text color={'inherit'}>{value}</Text>
			</Flex>
		</Flex>
	);
};
export default function SideBar() {
	const {t} = useTranslation()
	const menus: Menu[] = [
		{
			id: 'index',
			url: '/',
			value: t('common:home_page'),
			icon: DashboardIcon,
			display: true
		},
		{
			id: 'user',
			url: '/user',
			value: t('common:tenant_management'),
			icon: UsersIcon,
			display: true
		},
		{
			id: 'invoice',
			url: '/invoice',
			value: t('common:invoice_management'),
			icon: ReciptIcon,
			display: true
		},
		{
			id: 'announcement',
			url: '/announcement',
			value: t('common:announcement_management'),
			icon: AnnouncementIcon,
			display: true
		},
		{
			id: 'redemption code',
			url: '/redemption-code',
			value: t('common:redemption_code_management'),
			icon: CouponCodeIcon,
			display: true
		},
		{
			id: 'domain',
			url: '/domain',
			value: t('common:domain_management'),
			icon: GlobalIcon,
			display: true
		}
	];
	return (
		<Flex flexDirection="column" py={'22px'} gap={'8px'} px={'16px'}>
			{menus
				.filter((item) => item.display)
				.map((item, idx) => {
					return <SideBarItem key={item.id} url={item.url} icon={item.icon} value={item.value} />;
				})}
		</Flex>
	);
}
