import { Box, Flex, FormControl, FormLabel, Input, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { Field, FieldProps, Form, Formik, FormikProps } from 'formik';
import { produce } from 'immer';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSideProps } from 'next/types';
import { useEffect, useRef, useState, useTransition } from 'react';
import { z } from 'zod';
import { InvoiceStatusEnum, InvoiceStatusFilterEnum } from '~/@types/invoice';
import ReciptIcon from '~/components/common/icon/ReceiptIcon';
import InvoiceMenu from '~/components/common/menu/InvoiceMenu';
import { Refresh } from '~/components/common/Refresh';
import SwitchPage from '~/components/common/SwitchPage';
import { InvoiceTable } from '~/components/invoice/InvoiceTable';
import { api } from '~/utils/api';

export default function Home() {
	// const hello = api.post.hello.useQuery({ text: "from tRPC" });
	const formikRef = useRef<FormikProps<TinputhSchema>>(null)
	const [pageState, setPageState] = useState({
		pageSize: 100,
		pageIndex: 1,
		totalPage: 0,
		totalItem: 0
	});
	const queryClient = useQueryClient();
	const formSchema = z.object({
		companyName: z.string().optional().default(''),
		status: InvoiceStatusEnum.optional().default('all')
	});
	type TinputhSchema = z.infer<typeof formSchema>;
	const [queryState, setQueryState] = useState<TinputhSchema>({
		companyName: '',
		status: 'all'
	});
	const invoiceListQuery = api.invoice.getInvoiceList.useQuery({
		pageSize: pageState.pageSize,
		pageIndex: pageState.pageIndex - 1,
		// status: queryState.status
	})

	const { t } = useTranslation()
	useEffect(() => {
		if (!invoiceListQuery.isSuccess || invoiceListQuery.isFetching) return;
		setPageState({
			pageSize: invoiceListQuery.data.pageSize,
			pageIndex: invoiceListQuery.data.pageIndex + 1,
			totalPage: invoiceListQuery.data.totalPages,
			totalItem: invoiceListQuery.data.totalItems
		});
	}, [invoiceListQuery.data, invoiceListQuery.isFetching, invoiceListQuery.isSuccess]);
	const data = invoiceListQuery.data?.list ?? [];
	const [columnFilters, setColumnFilters] = useState<
		[
			{
				id: 'title',
				value: string
			},
			{
				id: 'status',
				value: InvoiceStatusFilterEnum
			}
		]
	>(
		[
			{
				id: 'title',
				value: ''
			},
			{
				id: 'status',
				value: ''
			}
		]
	)
	const [isPending, startTransition] = useTransition()
	return (
		<Box h={'100%'}>
			<Flex flexDirection="column" h={'full'} bg={'white'} px="24px" py="20px" borderRadius={'8px'}>
				<Flex mb={'8px'} justifyContent={'space-between'}>
					<Text fontSize={'20px'} fontWeight={500}>
						{t("common:invoice_management")}
					</Text>
					<Refresh
						onRefresh={function () {
							if (formikRef.current) formikRef.current.submitForm()
						}}
					/>
				</Flex>
				<Tabs flex={1} display={'flex'} flexDir={'column'} variant={'primary'} h={'full'}>
					<TabList>
						<Tab>
							<ReciptIcon boxSize={'18px'} fill={'currentcolor'} />
							<Text>{t("invoice:invoice_application")}</Text>
						</Tab>
					</TabList>
					<TabPanels mt="20px" flexDirection={'column'} flex={'1'} display={'flex'} h={'full'}>
						<TabPanel p={'0'} h={'full'} flex={'1'} display={'flex'} flexDirection={'column'}>
							<Formik<TinputhSchema>
								initialValues={{
									companyName: '',
									status: 'all'
								}}
								innerRef={formikRef}
								validateOnBlur={false}
								onSubmit={(values, actions) => {
									const queryKey = getQueryKey(api.invoice.getInvoiceList);
									setQueryState(values);
									setPageState(
										produce(pageState, (draft) => {
											draft.pageIndex = 1;
											return draft;
										})
									);
									return queryClient.invalidateQueries({
										queryKey
									});
								}}
							>
								{(props) => (
									<Form onKeyUp={(e) => e.key === 'Enter' && props.submitForm()}>

										<Flex wrap={'wrap'} gap={'16px'} mb={'16px'}>
											<Field name="companyName">
												{({ field, form }: FieldProps<TinputhSchema['companyName'], TinputhSchema>) => (
													<FormControl
														display={'flex'}
														alignItems={'center'}
														width={'auto'}
														mr={'16px'}
														justifyContent={'space-between'}
													>
														<FormLabel width={'75px'}>{t("invoice:company_name")}</FormLabel>
														<Input
															value={queryState.companyName}
															onChange={(e) => {
																// field.onChange(e)
																setQueryState(
																	produce(queryState, (draft) => {
																		draft.companyName = e.target.value
																		return draft;
																	})
																)
																startTransition(() => setColumnFilters(produce(columnFilters, (draft) => {
																	draft[0].value = e.target.value
																	return draft
																})))
															}}
															name={field.name}
															type="text" width={'280px'}
															placeholder={t("invoice:company_name")} />
													</FormControl>
												)}
											</Field>
											<Field name='status'>
												{({ field, form }: FieldProps<TinputhSchema['status'], TinputhSchema>) => (
													<FormControl
														display={'flex'}
														alignItems={'center'}
														width={'auto'}
														mr={'16px'}
														justifyContent={'space-between'}
													>
														<FormLabel width={'75px'}>{t("invoice:invoice_status._self")}</FormLabel>
														<InvoiceMenu status={field.value}
															width={'280px'}
															onUpdateStatus={function (status: InvoiceStatusEnum): void {
																form.setFieldValue('status', status);
																setColumnFilters(produce(columnFilters, (draft) => {
																	draft[1].value = InvoiceStatusFilterEnum.parse(status)
																	return draft
																}))
															}}
															isDisabled={false} {...field} />
													</FormControl>)
												}
											</Field>
										</Flex>
									</Form>
								)}
							</Formik>

							<InvoiceTable data={data} h={'0'} flex={'auto'} mt='4px' columnFilters={columnFilters} />
							<SwitchPage
								ml={'auto'}
								mr={'0'}
								minW={'unset'}
								flexBasis={'max-content'}
								flexShrink={'0'}
								currentPage={pageState.pageIndex}
								totalPage={pageState.totalPage}
								totalItem={pageState.totalItem}
								pageSize={pageState.pageSize}
								setCurrentPage={function (idx: number): void {
									const data = produce(pageState, (draft) => {
										draft.pageIndex = idx;
										draft.pageSize;
									});
									setPageState(data);
								}}
							/>
						</TabPanel>
					</TabPanels>
				</Tabs>
			</Flex>

		</Box>
	);
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
	return {
		props: {
			...(await serverSideTranslations(locale ?? 'zh', ['common', "applist", "invoice"])),
		},
	};
};