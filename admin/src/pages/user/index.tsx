import { Box, Flex, FormControl, FormLabel, Input, Text } from '@chakra-ui/react';
import { ListIcon, useMessage } from '@sealos/ui';
import { keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { useFormik } from 'formik';
import { produce } from 'immer';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next/types';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Refresh } from '~/components/common/Refresh';
import SwitchPage from '~/components/common/SwitchPage';
import CreateUserModal from '~/components/user/CreateUserModal';
import { UserTable } from '~/components/user/UserTable';
import { api } from '~/utils/api';

const userIdRegex = /^[A-Za-z0-9_-]{4,}$/;
const workspaceIdRegex = /^ns-[A-Za-z0-9_-]{1,}$/;

export default function Home() {
	// const hello = api.post.hello.useQuery({ text: "from tRPC" });
	const [pageState, setPageState] = useState({
		pageSize: 10,
		pageIndex: 1,
		totalPage: 0,
		totalItem: 0
	});
	const queryClient = useQueryClient();
	const formSchema = z.object({
		id: z.string()
			.optional()
			.refine(value => value === undefined || value.trim() === '' || value === null || userIdRegex.test(value), {
				message: 'must be nanoid',
			}),
		phone: z.string().regex(/^\d*$/, 'phone must be number'),
		workspaceId: z.string().optional().refine(value=> value=== undefined || value === null || value.trim() === '' || workspaceIdRegex.test(value), 'workspaceId must be ns-6 string'),
		workspaceName: z.string().default('')
	});
	type TinputhSchema = z.infer<typeof formSchema>;
	const [queryState, setQueryState] = useState<TinputhSchema>({
		id: '',
		phone: '',
		workspaceId: '',
		workspaceName: ''
	});
	const { message: toast } = useMessage()
	const formik = useFormik<TinputhSchema>({
		initialValues: queryState,
		validateOnBlur: false,
		onSubmit: (values, actions) => {
			const result = formSchema.safeParse(values);
			if (!result.success) {
				const fieldErrors = result.error.flatten().fieldErrors;
				if(fieldErrors.id) {
					toast({
						title: `输入的 用户ID 只能是 nanoid , 请重新输入`,
						status: "error",
					});
					throw Error()
				}

				if(fieldErrors.phone) {
					toast({
						title: `输入的 手机号 只能是数字, 请重新输入`,
						status: "error",
					});
					throw Error()
				}

				if(fieldErrors.workspaceId) {
					toast({
						title: `输入的 工作空间ID 只能是 ns-{{ 6位 nanoid }}, 请重新输入`,
						status: "error",
					});
					throw Error()
				}
			}
			const queryKey = getQueryKey(api.user.getUserList);
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
		},
	});
	const router = useRouter();

	useEffect(() => {
		if (!router.isReady) return;
		const workspaceIdReturn = z.string().safeParse(router.query.workspaceId);

		if (!workspaceIdReturn.success || !workspaceIdReturn.data) {
			return;
		} else { 
			const workspaceId = workspaceIdReturn.data;
			formik.setFieldValue('workspaceId', workspaceId)
			setQueryState(s=>({...s, workspaceId}));
			router.replace({
				pathname: router.pathname,
				query: { ...router.query, workspaceId: undefined },
			}, undefined, { shallow: true });
			return;
		}
	}, [router.isReady]);


	const getUserListQuery = api.user.getUserList.useQuery(
		{
			pageIndex: pageState.pageIndex - 1,
			pageSize: pageState.pageSize,
			...queryState
		},
		{
			placeholderData: keepPreviousData
		}
	);
	const { t } = useTranslation()
	useEffect(() => {
		if (!getUserListQuery.isSuccess || getUserListQuery.isFetching) return;
		setPageState({
			pageSize: getUserListQuery.data.pageSize,
			pageIndex: getUserListQuery.data.pageIndex + 1,
			totalPage: getUserListQuery.data.totalPages,
			totalItem: getUserListQuery.data.totalItems
		});
	}, [getUserListQuery.data, getUserListQuery.isFetching, getUserListQuery.isSuccess]);
	const data = !getUserListQuery.isPlaceholderData ? getUserListQuery.data?.userList ?? [] : [];

	return (
		<Box h={'100%'}>
			<Flex flexDirection="column" h={'full'} bg={'white'} px="24px" py="20px" borderRadius={'8px'}>
				<form
					onSubmit={formik.handleSubmit}
					onKeyUp={(e) => e.key === 'Enter' && formik.handleSubmit()}>
					<Flex mb={'16px'} justifyContent={'space-between'}>
						<Text fontSize={'20px'} fontWeight={500}>
							{t("common:tenant_management")}
						</Text>
						<Refresh
							onRefresh={function () {
								return formik.handleSubmit();
							}}
						/>
					</Flex>
					<Flex wrap={'wrap'} justifyContent={'space-between'} gap={'16px'}>
						<FormControl
							display={'flex'}
							alignItems={'center'}
							width={'512px'}
							justifyContent={'space-between'}
						>
							<FormLabel width={'112px'}>{t("common:user_id")}</FormLabel>
							<Input value={formik.values.id} onChange={formik.handleChange('id')} type="text" width={'400px'} name='id'/>
						</FormControl>
						<FormControl
							display={'flex'}
							alignItems={'center'}
							width={'512px'} 
							justifyContent={'space-between'}
						>
							<FormLabel width={'112px'}>{t("common:workspace_id")}</FormLabel>
							<Input value={formik.values.workspaceId} onChange={formik.handleChange('workspaceId')} type="text" width={'400px'} name='workspaceId'/>
						</FormControl>
						<FormControl
							display={'flex'}
							alignItems={'center'}
							width={'512px'}
							justifyContent={'space-between'}
						>
							<FormLabel width={'112px'}>{t("common:phone")}</FormLabel>
							<Input onChange={formik.handleChange('phone')} type="text" width={'400px'} value={formik.values.phone} name='phone'/>
						</FormControl>
						<FormControl
							display={'flex'}
							alignItems={'center'}
							width={'512px'}
							justifyContent={'space-between'}
						>
							<FormLabel width={'112px'}>{t("common:workspace_name")}</FormLabel>
							<Input onChange={formik.handleChange('workspaceName')} type="text" width={'400px'} value={formik.values.workspaceName} name='workspaceName'/>
						</FormControl>
					</Flex>
				</form>
				<Flex w={'full'} justify={'space-between'} align={'center'} mt={'24px'} mb={'12px'}>
					<Flex gap={'8px'} align={'center'}>
						<ListIcon boxSize={'16px'}></ListIcon>
						<Text fontWeight={'500'}>{t("common:user_list")}</Text>
					</Flex>
					<CreateUserModal />
				</Flex>

				<UserTable data={data} h={0} />
				<SwitchPage
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