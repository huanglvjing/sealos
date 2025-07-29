import { Button, Flex, Text, VStack } from '@chakra-ui/react';
import { LeftArrowIcon } from '@sealos/ui';
import { format } from 'date-fns';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
// import { useRouter } from ;
import { z } from 'zod';
import { announcementEnum } from '~/@types/announcement';
import { api } from '~/utils/api';

export default function Page() {
	const router = useRouter();
	const announcementReturn = z.string().safeParse(router.query.announcementName);
	useEffect(() => {
		if (!router.isReady) return;
		if (!announcementReturn.success || !announcementReturn.data) {
			router.push('/announcement');
			return;
		}
	}, [router.isReady]);

	const { t } = useTranslation();
	const query = api.announcement.getAnnouncement.useQuery({
		name: announcementReturn.data!,
	})
	useEffect(() => {
		if (query.isError) {
			router.push('/announcement')
			return
		}
	}, [query.isError])
	const notification = query.data?.notification
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
						router.push('/announcement');
					}}
					alignItems={'center'}
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
			<VStack gap={'24px'} mt={'24px'} mx={'168px'} fontSize={'12px'}>
			<Flex w={'full'} color={'grayModern.600'}>
					<Text width={'50px'}>{t('common:type')}</Text>
					<Text color={'grayModern.900'}>{t(`announcement:announcement_type.${notification?.metadata.labels.announcementType ??announcementEnum.enum.event}`)}</Text>
				</Flex>
				<Flex w={'full'} color={'grayModern.600'}>
					<Text width={'50px'}>{t('common:time')}</Text>
					<Text color={'grayModern.900'}>{notification?.metadata?.creationTimestamp ? format(new Date(notification.metadata.creationTimestamp), 'yyyy-MM-dd') : '-'}</Text>
				</Flex>
				<Flex justify={'space-between'} w={'full'} color={'grayModern.600'}>
					<Text width={'50px'}>{t('common:content')}</Text>
					<Flex direction={'column'} wrap={'wrap'}
						px={'12px'}
						py={'8px'}
						flex={1} color={'grayModern.900'} borderRadius={'6px'} border={'1px solid'} borderColor={'grayModern.200'} >
						<Text whiteSpace={'pre-line'}>{notification?.spec?.title?.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Text>
					</Flex>
				</Flex>
			</VStack>
		</Flex>
	);
}
export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
	return {
		props: {
			...(await serverSideTranslations(locale ?? 'zh', ['common', "applist", "announcement"])),
		},
	};
};