import { Box, BoxProps, ColorProps, Flex, FlexProps, Stack, Text, Tooltip } from '@chakra-ui/react';
import { ListIcon } from '@sealos/ui';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useTranslation } from 'next-i18next';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import RegionMenu from '~/components/common/menu/RegionMenu';
import { BaseTable } from '~/components/common/table/BaseTable';
import { api, RouterOutputs } from '~/utils/api';
import UpdateQuotaModal from '../UpdateQuotaModal';
function QuotaProgress({
	children,
	text,
	used,
	limit,
	progressColor,
	...styles
}: {
	children: ReactNode;
	name: string;
	progressColor: ColorProps['color'];
	text: ReactNode;
	used: number;
	limit: number;
} & FlexProps) {
	return (
		<Tooltip
			bg={'white'}
			hasArrow={true}
			placement="top-end"
			label={text}
			arrowShadowColor={' rgba(0,0,0,0.1)'}
			arrowSize={12}
			offset={[0, 15]}
			px={'17px'}
			py={'14px'}
			borderRadius={'8px'}
		>
			<Flex
				justify={'space-between'}
				align={'center'}
				fontSize={'12px'}
				textTransform={'capitalize'}
				width={'160px'}
				{...styles}
			>
				{children}
				<Flex w="160px" h="7px" bg="grayModern.200" borderRadius={'4px'} overflow={'hidden'}>
					<Flex
						borderRadius={'4px'}
						w={Math.floor((used * 100) / limit) + '%'}
						bgColor={progressColor}
					/>
				</Flex>
			</Flex>
		</Tooltip>
	);
}
type TresourceQuotaInfo = RouterOutputs['user']['getQuota'][number]['resourceQuotaInfo']

function QuotaCell<U extends keyof TresourceQuotaInfo['hard']>({
	limit,
	used,
	name,
	...props
}: {
	limit: TresourceQuotaInfo['hard'][U];
	name: string;
	used: TresourceQuotaInfo['used'][U];
} & BoxProps) {
	const { t } = useTranslation()
	return <Box>
		<QuotaProgress
			name={name}
			limit={limit.value}
			used={used.value}
			progressColor={'teal.500'}
			justifyContent={'space-between'}
			text={
				<Stack color={'grayModern.900'} minW="85px" p={0} gap={'6px'}>
					<Text>
						{t("common:total")}: {limit.value} {limit.unit}
					</Text>
					<Text>
						{t("common:used")}: {used.value} {used.unit}
					</Text>
					<Text>
						{t("common:remain")}: {limit.value - used.value} {limit.unit}
					</Text>
				</Stack>
			}
		>
			<></>
		</QuotaProgress>
	</Box>
}
export default function QuotaInfo({ id, ...props }: FlexProps & { id: string }) {
	const [region, setRegion] = useState<
		RouterOutputs['base']['getRegionList'][number] | undefined
	>();
	const quotaResult = api.user.getQuota.useQuery({
		id,
		regionUid: region?.uid
	});

	const [pageState, setPageState] = useState({
		pageSize: 10,
		pageIndex: 1,
		totalPage: 0,
		totalItem: 0
	});
	useEffect(() => {
		if (!quotaResult.isSuccess || pageState.totalItem === quotaResult.data.length) return;
		setPageState({
			pageSize: 10,
			pageIndex: 1,
			totalPage: Math.ceil(quotaResult.data.length ?? 0 / 10),
			totalItem: quotaResult.data.length ?? 0
		});
	}, [pageState.totalItem, quotaResult.data, quotaResult.isSuccess]);
	const data = useMemo(() => {
		return (
			quotaResult.data?.slice(
				(pageState.pageIndex - 1) * pageState.pageSize,
				pageState.pageIndex * pageState.pageSize
			) ?? []
		);
	}, [pageState.pageIndex, pageState.pageSize, quotaResult.data]);
	const { t } = useTranslation()
	const columns = useMemo(() => {
		const columnHelper =
			createColumnHelper<RouterOutputs['user']['getQuota'][number]>();
		return [
			columnHelper.accessor((row) => row.workspace.id, {
				header: t('common:workspace_id'),
				id: 'ns_id'
			}),
			columnHelper.accessor((row) => row.workspace.displayName, {
				header: t('common:workspace_name'),
				id: 'ns_displayName'
			}),
			columnHelper.accessor(
				(row) => ({ limit: row.resourceQuotaInfo.hard.cpu, used: row.resourceQuotaInfo.used.cpu } as const),
				{
					header: 'CPU',
					id: 'cpu',
					cell(props) {
						const { limit, used } = props.getValue()
						return (
							<QuotaCell limit={limit} used={used} name='CPU' />
						);
					}
				}
			),
			columnHelper.accessor(
				(row) => ({limit: row.resourceQuotaInfo.hard.memory, used: row.resourceQuotaInfo.used.memory} as const),
				{
					header: t('common:memory'),
					id: 'memory',
					cell(props) {
						const { limit, used } = props.getValue()
						return <QuotaCell<'memory'> limit={limit} used={used} name={t("common:memory")} />
					}
				}
			),
			columnHelper.accessor(
				(row) => ({limit: row.resourceQuotaInfo.hard.storage, used: row.resourceQuotaInfo.used.storage}),
				{
					header: t("common:storage"),
					id: 'storage',
					cell(props) {
						const { limit, used } = props.getValue()
						return <QuotaCell<'storage'> limit={limit} used={used} name={t("common:storage")} />
					}
				}
			),
			columnHelper.display({
				header: t('common:handle'),
				id: 'updateQuota',
				cell(cell) {
					const nsId = cell.row.original.workspace.id;
					const quota = cell.row.original.resourceQuotaInfo.hard || {};
					
					return <UpdateQuotaModal nsId={nsId} userId={id} quota={quota} domain={region?.domain} />;
				}
			})
		];
	}, [id, region?.domain]);
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel()
	});

	return (
		<Flex {...props} flexDir={'column'}>
			<Flex justify={'space-between'} mb={'12px'} flex={'0'}>
				<Flex gap={'8px'} px={'8px'} align={'center'}>
					<ListIcon boxSize={'20px'} />
					<Text fontSize={'16px'} fontWeight={500}>
						{t("common:source_quota")}
					</Text>
				</Flex>
				<Flex gap={'32px'} align={'center'}>
					<Text fontSize={'12px'} fontWeight={'500'}>
						{t("common:region")}
					</Text>
					<RegionMenu region={region} onUpdateRegion={setRegion} isDisabled={false} width="240px" />
				</Flex>
			</Flex>
			<BaseTable table={table} flex={'1 auto'} />
		</Flex>
	);
}
