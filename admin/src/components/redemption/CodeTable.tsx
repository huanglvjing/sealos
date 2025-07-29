import { TableProps } from '@chakra-ui/react';
import { useMessage } from '@sealos/ui';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { format } from 'date-fns';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';
import { CodeStatusEnum } from '~/@types/redemptionCode';
import { api, RouterOutputs } from '~/utils/api';
import { BaseTable } from '../common/table/BaseTable';
import { CodeStatus } from './Status';
export function CodeTable({
	data = [],
	...props
}: { data: RouterOutputs['code']['getCodeList']['list'] } & TableProps) {
	const toast = useMessage();
	const getTokenMutation = api.user.getToken.useMutation();
	const { t } = useTranslation()
	const columns = useMemo(() => {
		const columnHelper =
			createColumnHelper<RouterOutputs['code']['getCodeList']['list'][number]>();
		return [
			columnHelper.accessor((row) => row.code, {
				header: t('redemptionCode:code'),
				id: 'code'
			}),
			columnHelper.accessor((row) => row.used, {
				header: t('common:status'),
				id: 'status',
				cell: (cell) => {
					const status = cell.row.original.used ? CodeStatusEnum.Enum.used : CodeStatusEnum.Enum.unused;
					return <CodeStatus status={status} />
				}
			}),
			columnHelper.accessor((row) => row.createdAt, {
				header: t('redemptionCode:create_at'),
				id: 'createdAt',
				cell(props) {
					return format(props.getValue(), 'yyyy-MM-dd')
				}
			}),
			columnHelper.accessor(row => row.user?.id, {
				header: t('redemptionCode:used_by'),
				id: 'usedBy',
				cell(props) {
					return props.getValue() ?? '-'
				}
			}),
			columnHelper.accessor((row) => row.comment, {
				header: t('redemptionCode:comment'),
				id: 'comment',
				cell(props) {
					const value = props.getValue()

					return value ?? '-'
				}
			}),
		];
	}, [t]);
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel()
	});
	return <BaseTable table={table} h="auto" {...props} />;
}
