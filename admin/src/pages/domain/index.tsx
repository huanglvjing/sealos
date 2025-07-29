import { Box, Flex, FormControl, FormLabel, Input, Text } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { ColumnFiltersState } from '@tanstack/react-table';
import { getQueryKey } from '@trpc/react-query';
import { Field, FieldProps, Form, Formik } from 'formik';
import { produce } from 'immer';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSideProps } from 'next/types';
import { useEffect, useState, useTransition } from 'react';
import { z } from 'zod';
import { DomainStatusEnum } from '~/@types/domain';
import RegionMenu from '~/components/common/menu/RegionMenu';
import { Refresh } from '~/components/common/Refresh';
import SwitchInfinitePage from '~/components/common/SwitchInfinitePage';
import { DomainTable } from '~/components/domain/DomainTable';
import { api, RouterOutputs } from '~/utils/api';

export default function Home() {
	// const hello = api.post.hello.useQuery({ text: "from tRPC" });
	const [region, setRegion] = useState<RouterOutputs['base']['getRegionList'][number] | undefined>(undefined);
	const [pageState, setPageState] = useState({
		pageSize: 500,
		pageIndex: 1,
		totalPage: 0,
		totalItem: 0
	});
	// reset pageIdx to 1 when the region changes
	useEffect(() => {
		setPageState((state) => produce(state, (draft) => {
			draft.pageIndex = 1;
			return draft;
		}))
	}, [region]);
	const queryClient = useQueryClient();
	const formSchema = z.object({
		status: DomainStatusEnum.default('all'),
		regionDomain: z.string().default(''),
		domain: z.string().default('')
	});
	type TinputhSchema = z.infer<typeof formSchema>;
	const [queryState, setQueryState] = useState<TinputhSchema>({
		domain: '',
		regionDomain: region?.domain ?? '',
		status: 'all',
	});
	const getDomainQuery = api.domain.getDomain.useInfiniteQuery({
		pageSize: pageState.pageSize,
		regionUid: region?.uid,
		status: queryState.status,
	}, {
		getNextPageParam(lastPage) {
			return lastPage.nextCursor
		},
		staleTime: 60_000 * 5
	});

	const { t } = useTranslation()
	useEffect(() => {
		if (!getDomainQuery.isSuccess || !getDomainQuery.data) return;
		setPageState((state) => produce(state, (draft) => {
			draft.totalPage = getDomainQuery.data.pages.length + (getDomainQuery.hasNextPage ? 1 : 0);
			if (getDomainQuery.data.pages.length === 0) return draft;
			return draft;
		}))
	}, [getDomainQuery.data, getDomainQuery.hasNextPage, getDomainQuery.isSuccess,]);
	
	const data = getDomainQuery.data?.pages[pageState.pageIndex - 1]?.list ?? [];
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]) 
	const [isPending, startTransition]= useTransition()
	return (
		<Box h={'100%'}>
			<Flex flexDirection="column" h={'full'} bg={'white'} px="24px" py="20px" borderRadius={'8px'} gap={'32px'}>
				<Formik<TinputhSchema>
					initialValues={{
						regionDomain: '',
						status: 'all',
						domain: ''
					}}
					
					validateOnBlur={true}
					onSubmit={(values, actions) => {
						const queryKey = getQueryKey(api.domain.getDomain);
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

							<Flex mb={'16px'} justifyContent={'space-between'}>
								<Text fontSize={'20px'} fontWeight={500}>
									{t("common:domain_management")}
								</Text>
								<Refresh
									onRefresh={function () {
										return props.submitForm();
									}}
								/>
							</Flex>
							<Flex wrap={'wrap'} gap={'16px'}>

								<Field name="regionDomain" >
									{({ field, form }: FieldProps<TinputhSchema['regionDomain'], TinputhSchema>) => (
										<FormControl
											display={'flex'}
											alignItems={'center'}
											width={'auto'}
											mr={'16px'}
											justifyContent={'space-between'}
										>
											<Flex gap={'32px'} align={'center'} >
												<Text fontSize={'12px'} fontWeight={'500'}>
													{t('common:region')}
												</Text>
												<RegionMenu region={region} onUpdateRegion={setRegion} isDisabled={false} width="240px" />
											</Flex>
										</FormControl>
									)}
								</Field>
								<Field name="domain">
									{({ field, form }: FieldProps<TinputhSchema['domain'], TinputhSchema>) => (
										<FormControl
											display={'flex'}
											alignItems={'center'}
											width={'auto'}
											mr={'16px'}
											justifyContent={'space-between'}
										>
											<FormLabel width={'75px'}>{t("common:second_level_domain")}</FormLabel>
											<Input onChange={(e) => startTransition(
												()=>{
													setColumnFilters([
														{
															id: 'domain',
															value: e.target.value
														}
													])
												})} type="text" width={'280px'} placeholder={t("common:second_level_domain")} />
										</FormControl>
									)}
								</Field>
								{/* <Field>
									{({ field, form }: FieldProps<TinputhSchema['status'], TinputhSchema>) => (
										<FormControl
											display={'flex'}
											alignItems={'center'}
											width={'auto'}
											mb={'16px'}
											justifyContent={'space-between'}
										>
											<FormLabel width={'75px'}>{t("common:domain_status._self")}</FormLabel>
											<InvoiceMenu status={field.value}
												width={'280px'}
												onUpdateStatus={function (status?: InvoiceStatusEnum): void {
													form.setFieldValue('status', status);
												}}
												isDisabled={false} {...field} />

										</FormControl>)
									}
								</Field> */}
							</Flex>
						</Form>
					)}
				</Formik>
				<DomainTable data={data} columnFilters={columnFilters} h={0} />
				<SwitchInfinitePage currentPage={pageState.pageIndex} totalPage={pageState.totalPage} pageSize={pageState.pageSize}
					setLastedPage={async function () {
						const hasNextPage = getDomainQuery.hasNextPage;
						let endPage = pageState.totalPage;
						if (hasNextPage) {
							const result = await getDomainQuery.fetchNextPage();
							endPage = result.hasNextPage ? pageState.totalPage + 1 : pageState.totalPage;
						}
						setPageState(s => produce(s, (draft) => {
							draft.pageIndex = endPage;
							return draft;
						}));
					}} setFirstPage={async function () {
						setPageState(produce((draft) => {
							draft.pageIndex = 1;
							return draft
						}));
					}} setPreviousPage={async function () {
						setPageState(produce(pageState, (draft) => {
							draft.pageIndex -= 1;
							return draft
						}));
					}} setNetxPage={async function () {
						const hasNextPage = getDomainQuery.hasNextPage;
						if (hasNextPage) {
							await getDomainQuery.fetchNextPage();
						}
						setPageState(s => produce(s, (draft) => {
							draft.pageIndex += 1;
							return draft
						}));
					}}
				/>
			</Flex>
		</Box>
	);
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
	return {
		props: {
			...(await serverSideTranslations(locale ?? 'zh', ['common', "applist"])),
		},
	};
};