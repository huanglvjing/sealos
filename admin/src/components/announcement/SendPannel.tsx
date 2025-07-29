import { Box, Button, Flex, TabPanel, TabPanelProps, Text, Textarea } from '@chakra-ui/react';
import { useMessage } from '@sealos/ui';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { z } from 'zod';
import { api, RouterOutputs } from '~/utils/api';
import RegionMenu from '../common/menu/RegionMenu';

export default function SendPanel(props: TabPanelProps) {
	const {t} = useTranslation()
	const [region, setRegion] = useState<RouterOutputs['base']['getRegionList'][number] | undefined>(undefined);
	const [text, setText] = useState('')
	const mutation = api.announcement.createAnnuncement.useMutation()
	const toast = useMessage({
		duration: 3000,
		isClosable: true,
	})
	const utils = api.useUtils()
	return (
		<TabPanel {...props} h={'full'} flex={1} display={'flex'} flexDir={'column'}>
				<Flex gap={'32px'} align={'center'} my={'20px'}>
					<Text fontSize={'12px'} fontWeight={'500'}>
						{t('common:region')}
					</Text>
					<RegionMenu region={region} onUpdateRegion={setRegion} isDisabled={false} width="240px" />
				</Flex>
			<Box overflow={'auto'} flex={'auto'} w={'full'} h={'0'}>
				<Textarea
				value={text} onChange={e=>{setText(e.target.value)}} placeholder={t("announcement:input_send_content")}/>
				<Flex w='full' justifyContent={'flex-end'}>
				<Button variant={'solid'} mt={'32px'} isDisabled={mutation.isPending} 
				
				onClick={async ()=>{
					try {
						const textResult = z.string().min(3).safeParse(text)
						console.log(textResult)
						if (!textResult.success) {
							toast.message({
								title: t('announcement:send_failed'),
								status: 'error'
							})
							return
						}
						const result = await mutation.mutateAsync({
							regionUid: region?.uid,
							text: textResult.data
						})
						console.log(result)
						toast.message({
							title: t('announcement:send_success'),
							status:'success'
						})
						utils.announcement.listAnnouncement.invalidate()
					} catch (error) {
						console.log(error)
						toast.message({
							title: t('announcement:send_failed'),
							status: 'error'
						})
					}
				}}>
					{t('common:send')}
				</Button>
				</Flex>

			</Box>
		</TabPanel>
	);
}