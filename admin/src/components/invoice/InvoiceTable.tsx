import { Box, Flex, TableContainerProps, Text } from '@chakra-ui/react';
import {
	ColumnFiltersState,
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	useReactTable
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';
import { RouterOutputs } from '~/utils/api';
import { formatMoney } from '~/utils/format';
import CurrencyIcon from '../common/icon/CurrencyIcon';
import { BaseTable } from '../common/table/BaseTable';
import InvoiceDetails from './InvoiceDetailsModal';
import { InvoiceStatus } from './Status';
export function InvoiceTable({
	data,
	onSelect,
	columnFilters,
	...props
}: {
	data: RouterOutputs['invoice']['getInvoiceList']['list'];
	onSelect?: (type: boolean, item: any) => void;
	columnFilters: ColumnFiltersState;
} & TableContainerProps) {
	const { t } = useTranslation();
	const columns = useMemo(() => {
		const columnHelper = createColumnHelper<RouterOutputs['invoice']['getInvoiceList']['list'][number]>();

		function CustomTh(props: any) {
			return (
				<Flex display={'flex'} alignItems={'center'}>
					<Text mr="4px">{ }</Text>
					<Text>
						<CurrencyIcon />
					</Text>
				</Flex>
			);
		};
		return [
			columnHelper.accessor((row) => row.detail.detail.title, {
				id: 'title',
				header: t('invoice:company_name'),
				cell(props) {
					const companyName = props.cell.getValue();
					return <Text>{companyName}</Text>;
				}
			}),
			columnHelper.accessor((row) => row.detail.contract.email, {
				id: 'email',
				header: t('common:email'),
				// cell(props) {
				//   const email = props.cell.getValue();
				//   return <Text>{emai}</Text>;
				// }
			}),
			columnHelper.accessor((row) => [
				row.created_at,
				row.updated_at,
				row.status
			] as const, {
				id: 'time',
				header: t('invoice:commit_time') + '/' + t('invoice:complete_time'),
				cell(props) {
					const [createdAt, updateAt, status] = props.cell.getValue();
					return <Box>
						<Text>{createdAt ? format(new Date(createdAt), 'yyyy-MM-dd HH:mm') : '-'}</Text>
						<Text>{status === 'completed' && updateAt ? format(new Date(updateAt), 'yyyy-MM-dd HH:mm') : '-'}</Text>
					</Box>;
				}
			}),
			columnHelper.accessor((row) => row.total_amount, {
				id: 'amount',
				header(props) {
					return <Flex display={'flex'} alignItems={'center'}>
						<Text mr="4px">{t('invoice:invoice_amount')}</Text>
						<CurrencyIcon />
					</Flex>
				},
				cell(props) {
					const amount = Number(props.cell.getValue());
					return (
						<Text gap={'6px'} color={'brightBlue.600'}>
							{formatMoney(amount)}
						</Text>
					);
				}
			}),
			columnHelper.accessor((row) => row.status, {
				id: 'status',
				header: t('common:status'),
				cell(props) {
					const status = props.cell.getValue();
					return <InvoiceStatus status={status}></InvoiceStatus>;
				},
				enableColumnFilter: true,
				
			}),
			columnHelper.accessor((row) => [row.detail, row.total_amount, row.id, row.user_id] as const, {
				id: 'handle',
				header: t('common:handle'),
				cell(props) {
					const [detail, totalAmount, invoiceId, userId] = props.cell.getValue();
					return (
						<InvoiceDetails
							userId={userId}
							invoiceId={invoiceId}
							// toInvoiceDetail={toInvoiceDetail}
							invoice={detail}
							totalAmount={formatMoney(Number(totalAmount))} />
					);
				},
				enablePinning: true
			})
		];
	}, [t]);
	console.log(columnFilters)
	const table = useReactTable({
		data,
		state: {
			columnPinning: {
				left: ['title'],
				right: ['handle']
			},
			columnFilters
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel()
	});
	return <BaseTable {...props} table={table}></BaseTable>;
}