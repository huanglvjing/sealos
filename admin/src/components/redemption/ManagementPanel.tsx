import {
	Box,
	Button,
	Flex, FormControl, FormLabel, Input,
	TabPanel, TabPanelProps,
	Text
} from '@chakra-ui/react';
import { ListIcon, useMessage } from '@sealos/ui';
import { endOfDay, startOfDay } from 'date-fns';
import { saveAs } from 'file-saver';
import { useFormik } from 'formik';
import { produce } from 'immer';
import { useTranslation } from 'next-i18next';
import { useEffect, useState, useTransition } from 'react';
import { z } from 'zod';
import { CodeStatusEnum } from '~/@types/redemptionCode';
import { api } from '~/utils/api';
import { getFormikFieldProps, getFormikHelper } from '~/utils/formik';
import ExportIcon from '../common/icon/ExportIcon';
import CodeStatusMenu from '../common/menu/CodeStatusMenu';
import SelectRange from '../common/SelectDateRange';
import SwitchPage from '../common/SwitchPage';
import { CodeTable } from './CodeTable';

export default function ManagementPanel(props: TabPanelProps) {
	const { t } = useTranslation()
	const { message } = useMessage()
	const formSchema = z.object({
		code: z.string(),
		startTime: z.date(),
		endTime: z.date(),
		id: z.string(),
		comment: z.string(),
		status: CodeStatusEnum
	});
	type TinputhSchema = z.infer<typeof formSchema>;
	const [pageState, setPageState] = useState({
		pageIndex: 1,
		pageSize: 10,
		totalPage: 0,
		totalItem: 0
	});
	const formik = useFormik<TinputhSchema>({
		initialValues: {
			startTime: startOfDay(new Date(2023, 0, 1)),
			endTime: endOfDay(new Date()),
			comment: '',
			id: '',
			status: 'all',
			code: ''
		},
		onSubmit: (values, actions) => {
			return void 0
		},
	});
	const [debouncedValues, setDebouncedValues] = useState({
		comment: formik.values.comment,
		id: formik.values.id,
		code: formik.values.code,
	});

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValues({
				comment: formik.values.comment,
				id: formik.values.id,
				code: formik.values.code,
			});
		}, 300); 

		return () => {
			clearTimeout(handler);
		};
	}, [formik.values.comment, formik.values.id, formik.values.code]);
	const fieldHelpersFactory = getFormikHelper(formik)
	const fieldInputPropsFactory = getFormikFieldProps(formik)
	const codeListQuery = api.code.getCodeList.useQuery({
		...debouncedValues,
		status: formik.values.status,
		startTime: formik.values.startTime,
		endTime: formik.values.endTime,
		pageIndex: pageState.pageIndex - 1,
		pageSize: pageState.pageSize
	})

	useEffect(() => {
		if (!codeListQuery.isSuccess || codeListQuery.isFetching) return
		const data = codeListQuery.data;
		setPageState(produce(pageState, (draft) => {
			draft.totalPage = data.totalPages;
			draft.totalItem = data.totalItems;
			draft.pageIndex = data.pageIndex + 1;
			draft.pageSize = data.pageSize;
			return draft;
		}));

	}, [codeListQuery.isSuccess, codeListQuery.data, codeListQuery.isFetching])
	const [isPending, startTransition] = useTransition()
	const downloadCSVMutation = api.code.downloadCodeList.useMutation()
	return (<TabPanel {...props} h={'full'} flex={1} display={'flex'} flexDir={'column'}>
		<Box h={'100%'}>
			<Flex flexDirection="column" h={'full'} bg={'white'} py="16px" borderRadius={'8px'}>
				<form
					onSubmit={formik.handleSubmit}
					onKeyUp={(e) => e.key === 'Enter' && formik.handleSubmit()}>
					<Flex wrap={'wrap'} gap={'16px'}>
						<FormControl
							display={'flex'}
							alignItems={'center'}
							mr={'16px'}
							width={'auto'}
						>
							<FormLabel width={'65px'}>{t('redemptionCode:code')}</FormLabel>
							<Input {...fieldInputPropsFactory('code')} type="text" width={'285px'} />
						</FormControl>
						<FormControl
							display={'flex'}
							alignItems={'center'}
							mr={'16px'}
							width={'auto'}
						>
							<FormLabel width={'65px'}>{t('redemptionCode:code_status._self')}</FormLabel>
							<CodeStatusMenu width={'285px'} status={formik.values.status} onUpdateStatus={function (status: CodeStatusEnum): void {
								fieldHelpersFactory('status').setValue(status)
							}} isDisabled={false} />
						</FormControl>
						<FormControl
							display={'flex'}
							alignItems={'center'}
							mr={'16px'}
							width={'auto'}
						>
							<FormLabel width={'65px'}>ID</FormLabel>
							<Input {...formik.getFieldProps('id')}
								type="text" width={'285px'} />
						</FormControl>
						<FormControl
							display={'flex'}
							alignItems={'center'}
							mr={'16px'}
							w={'auto'}
						>
							<FormLabel width={'65px'}>{t("redemptionCode:create_at")}</FormLabel>
							<SelectRange range={{
								from: formik.values.startTime,
								to: formik.values.endTime
							}} onRangeUpdate={(range) => {
								formik.setFieldValue('startTime', range.from);
								formik.setFieldValue('endTime', range.to);
							}}
								w={'285px'}
							/>
						</FormControl>
						<FormControl
							display={'flex'}
							alignItems={'center'}
							width={'auto'}
						>
							<FormLabel width={'65px'}>{t('redemptionCode:comment')}</FormLabel>
							<Input {...fieldInputPropsFactory('comment')} type="text" width={'285px'} />
						</FormControl>
					</Flex>

				</form>
				<Flex w={'full'} justify={'space-between'} align={'center'} mt={'24px'} mb={'12px'}>
					<Flex gap={'8px'} align={'center'} width={'full'}>
						<ListIcon boxSize={'16px'}></ListIcon>
						<Text fontWeight={'500'}>{t("redemptionCode:code_list")}</Text>
						<Button variant={'solid'}
							ml={'auto'}
							px={'14px'}
							py={'8px'}
							mr={'0'}
							fontSize={'12px'}
							onClick={async (e) => {
								try {
									const result = await downloadCSVMutation.mutateAsync({
										code: formik.values.code,
										id: formik.values.id,
										comment: formik.values.comment,
										status: formik.values.status,
										startTime: formik.values.startTime,
										endTime: formik.values.endTime,
									})
									console.log(result)
									const blob = new Blob([result], { type: 'text/csv;charset=utf-8;' });

									saveAs(blob, 'codeList.csv')
								} catch (e) {
									message({
										title: t('redemptionCode:export_failed'),
										status: 'error'
									})
								}
							}}>
							<ExportIcon boxSize={'16px'} fill={'currentcolor'} mr={'6px'} />
							{t('common:export')}
						</Button>
					</Flex>
				</Flex>
				<CodeTable data={codeListQuery.data?.list ?? []} flex={'auto'} h={'0'} />
				<SwitchPage
					ml={'auto'}
					mt={'22px'}
					mr={'0'}
					currentPage={pageState.pageIndex}
					totalPage={pageState.totalPage}
					totalItem={pageState.totalItem}
					pageSize={pageState.pageSize}
					setCurrentPage={function (idx: number): void {
						setPageState(
							produce(pageState, (draft) => {
								draft.pageIndex = idx;
								return draft;
							})
						);
					}} />
			</Flex>
		</Box>
	</TabPanel>);
}