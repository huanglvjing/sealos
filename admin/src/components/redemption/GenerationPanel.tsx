import {
	Box,
	Button, Center, Flex, FormControl, FormLabel, Input, Modal,
	ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Spinner, TabPanel, TabPanelProps,
	Text,
	useDisclosure
} from '@chakra-ui/react';
import { ListIcon, useMessage } from '@sealos/ui';
import { stringify } from 'csv-stringify';
import { addMonths } from 'date-fns';
import saveAs from 'file-saver';
import { useFormik } from 'formik';
import { produce } from 'immer';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { api, RouterOutputs } from '~/utils/api';
import { getFormikFieldProps, getFormikHelper } from '~/utils/formik';
import MyNumberInput from '../common/NumberInput';
import SelectRange from '../common/SelectDateRange';
import SwitchPage from '../common/SwitchPage';
import ExportIcon from '../common/icon/ExportIcon';

export default function GenerationPanel(props: TabPanelProps) {
	const { t } = useTranslation()
	const formSchema = z.object({
		count: z.number().int().positive('数量必须大于0'),
		endTime: z.date().refine(v => v.getTime() > new Date().getTime(), '过期时间必须大于当前时间'),
		coment: z.string(),
		amount: z.number().int().positive('金额必须大于0').max(1_000_000, '不能超出最大金额1_000_000'),
		prefix: z.string()
	});
	type TinputhSchema = z.infer<typeof formSchema>;
	const { message } = useMessage()
	const formik = useFormik<TinputhSchema>({
		initialValues: {
			count: 1,
			endTime: addMonths(new Date(), 1),
			coment: '',
			amount: 0,
			prefix: ''
		},
		validateOnBlur: false,
		async onSubmit(values, actions) {
			const result = formSchema.safeParse(values);
			if (!result.success) {
				const fieldErrors = result.error.flatten().fieldErrors;
				if (fieldErrors.count) {
					message({
						title: fieldErrors.count[0],
						status: "error",
					});
					return
				}
				if (fieldErrors.amount) {
					message({
						title: fieldErrors.amount[0],
						status: "error",
					});
					return
				}

				if (fieldErrors.endTime) {
					message({
						title: fieldErrors.endTime[0],
						status: "error",
					});
					return
				}
			}
			try {
				await generateMutation.mutateAsync({
					amount: BigInt(formik.values.amount),
					count: formik.values.count,
					endTime: formik.values.endTime,
					prefix: formik.values.prefix || undefined,
					comment: formik.values.coment
				})
				onOpen()
			} catch (error) {
				message({
					title: '生成失败',
					status: "error",
				});
			}
		},
	});
	const [pageState, setPageState] = useState({
		pageSize: 10,
		pageIndex: 1,
		totalPage: 0,
		totalItem: 0
	});
	const [codeList, setCodeList] = useState<RouterOutputs['code']['generateCode']>([]);
	const generateMutation = api.code.generateCode.useMutation()

	const fieldInputPropsFactory = getFormikFieldProps(formik)
	const fieldHelpersFactory = getFormikHelper(formik)
	const { isOpen, onClose, onOpen } = useDisclosure()
	// init pageState
	useEffect(() => {
		if (generateMutation.isSuccess) {
			const { data } = generateMutation;
			const { pageIndex, pageSize } = pageState;
			setPageState(produce(pageState, (draft) => {
				draft.totalPage = Math.ceil(data.length / pageSize);
				draft.totalItem = data.length;
				return draft;
			}));
		}
	}, [generateMutation.isSuccess]);

	// update codeList
	useEffect(() => {
		const { pageIndex, pageSize } = pageState;
		if (!generateMutation.data) return;
		const data = generateMutation.data;
		const start = (pageIndex - 1) * pageSize;
		const end = start + pageSize;
		const paginatedData = data.slice(start, end);
		setCodeList(paginatedData);
	}, [pageState.pageIndex, generateMutation.data])

	return (<TabPanel {...props} h={'full'} flex={1} display={'flex'} flexDir={'column'}>
		<form
			onSubmit={formik.handleSubmit}
		>
			<Flex flexDirection="column" h={'full'} bg={'white'} py="80px" borderRadius={'8px'} alignItems={'center'}>
				<Flex wrap={'wrap'} maxW={'550px'} gap={'16px'}>
					<FormControl
						display={'flex'}
						alignItems={'center'}
					>
						<FormLabel width={'90px'}>{t("redemptionCode:prefix")}</FormLabel>
						<Input {...fieldInputPropsFactory('prefix')} flex={'auto'} />
					</FormControl>
					<FormControl
						display={'flex'}
						alignItems={'center'}
					>
						<FormLabel width={'90px'}>{t("redemptionCode:generation_count")}</FormLabel>
						<MyNumberInput
							needCurrencyIcon={false}
							{...fieldInputPropsFactory('count')}
							onChange={(str, v) => {
								const helper = fieldHelpersFactory('count')
								if (!str || isNaN(v)) helper.setValue(0);
								else helper.setValue(v)
							}}
							flex={'auto'}
						/>
					</FormControl>

					<FormControl
						display={'flex'}
						alignItems={'center'}
					>
						<FormLabel width={'90px'}>{t("redemptionCode:range")}</FormLabel>
						<SelectRange range={{
							from: new Date(),
							to: formik.values.endTime
						}}
							lockStart
							onRangeUpdate={(range) => {
								const helper = fieldHelpersFactory('endTime')
								helper.setValue(range.to);
							}}
							flex={'auto'}
						/>
					</FormControl>
					<FormControl
						display={'flex'}
						alignItems={'center'}
					>
						<FormLabel width={'90px'}>{t("common:recharge_amount")}</FormLabel>
						<MyNumberInput
							{...fieldInputPropsFactory('amount')}
							onChange={(str, v) => {
								const helper = fieldHelpersFactory('amount')
								if (!str || isNaN(v)) helper.setValue(0);
								else helper.setValue(v)
							}}
							flex={'auto'}
						/>
					</FormControl>
					<FormControl
						display={'flex'}
						alignItems={'center'}
					>
						<FormLabel width={'90px'}>{t("redemptionCode:comment")}</FormLabel>
						<Input {...fieldInputPropsFactory('coment')} flex={'auto'} placeholder={t("redemptionCode:comment")}/>
					</FormControl>
					<Flex w={'full'} justify={'flex-end'}>
						<Button type='submit' variant={'solid'}>{t('common:generate')}</Button>
					</Flex>
				</Flex>
			</Flex>
		</form>
		<Modal isOpen={isOpen} onClose={onClose} isCentered>
			<ModalOverlay />
			<ModalContent
				borderRadius={'10px'}
				maxW={'440px'}
				bgColor={'#FFF'}
				backdropFilter="blur(150px)"
			>
				<ModalHeader
					px={'20px'}
					py={'12px'}
					bg={'grayModern.25'}
					borderBottom={'1px solid'}
					fontWeight={500}
					fontSize={'16px'}
					display={'flex'}
					gap={'10px'}
					borderColor={'grayModern.100'}
				>
					<Text>{t('redemptionCode:code_generation')}</Text>
				</ModalHeader>
				<ModalCloseButton top={'8px'} right={'20px'} />
				<ModalBody h="100%" w="100%" px="36px" py="24px" fontSize={'14px'}>
					{generateMutation.isPending ? (
						<Center>
							<Spinner mx="auto" />
						</Center>
					) : (
						<Box fontWeight={'400'} color={'grayModern.900'}>
							<Flex gap={'8px'} align={'center'} mb={'12px'} mt={'24px'} >
								<ListIcon boxSize={'18px'} color={'grayModern.900'} fill={'currentcolor'}></ListIcon>
								<Text fontWeight={'500'}>{t("redemptionCode:code_list")}</Text>
								<Button variant={'solid'} onClick={async () => {
									const data = (generateMutation.data ?? []).map(v=>{
										v.creditAmount = v.creditAmount / BigInt(1_000_000)
										return v
									})
									if (data.length === 0) {
										message({
											title: '没有可导出的数据',
											status: "error",
										});
										return
									}

									const result = await new Promise<string>((resolve, reject) => stringify(data, {
										header: true,
										columns: {
											code: 'Code',
											id: 'Id',
											used: 'Used',
											creditAmount: 'Credit Amount',
											createdAt: 'Created At',
											expiredAt: 'Expired At',
											usedAt: 'Used At',
											usedBy: 'Used By',
											comment: 'Comment',
										},
										cast: {
											date: (v) => v.toISOString(),
											bigint: (v) => v.toString(),
											boolean: (v) => v? 'true' : 'false',
											number: (v) => v.toString(),
										},
										
									}, (err, output) => {
										if (err) {
											message({
												title: t("redemptionCode:export_failed"),
												status: "error",
											});
											return reject(err)
										}
										return resolve(output)
									})
									)
									const blob = new Blob([result], { type: 'text/csv;charset=utf-8;' });
									saveAs(blob, 'generationCodeList.csv')
									
								}}
								fontWeight={500}
								px={'14px'}
								py={'8px'}
								ml={'auto'}
								mr={'0'}
								fontSize={'12px'}
								alignItems={'center'}
								>
									<ExportIcon boxSize={'16px'} fill={'currentcolor'} mr={'6px'} />
									{t('common:export')}
								</Button>
							</Flex>
							<Box 
							>
								{
									codeList.map((item, index) => (<Flex key={item.id}
										borderTop={index === 0 ? '1px solid' : undefined}
										borderBottom={'1px solid'}
										borderColor={'grayModern.150'}
										py={'16px'}
										px='24px'>
										{item.code}
									</Flex>))
								}
							</Box>
							<SwitchPage
								totalItem={generateMutation.data?.length ?? 0}
								totalPage={pageState.totalPage}
								currentPage={pageState.pageIndex}
								pageSize={pageState.pageSize}
								mt={'28px'}
								setCurrentPage={function (idx: number): void {
									setPageState(
										produce(pageState, (draft) => {
											draft.pageIndex = idx;
											return draft;
										})
									);
								}} />
						</Box>
					)}
				</ModalBody>
			</ModalContent>
		</Modal>
	</TabPanel>);
}