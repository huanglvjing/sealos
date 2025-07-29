import { TableContainerProps } from '@chakra-ui/react';
import {
	ColumnFiltersState,
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	useReactTable
} from '@tanstack/react-table';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';
import { RouterOutputs } from '~/utils/api';
import { BaseTable } from '../common/table/BaseTable';
import WorkspaceDetailButton from './WorkspaceDetailButton';
export function DomainTable({
  data,
  onSelect,
	columnFilters,
	...props
}: {
	columnFilters: ColumnFiltersState;
  data: RouterOutputs['domain']['getDomain']['list'];
  onSelect?: (type: boolean, item: any) => void;
} & TableContainerProps) {
  const { t } = useTranslation();
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<RouterOutputs['domain']['getDomain']['list'][number]>();
    return [
      columnHelper.accessor((row) => row.domain, {
        id: "domain",
				header: t('common:domain') as string,
      }),
			columnHelper.accessor((row) => row.workspaceId, {
        id: "workspace_id",
				header: t('common:workspace_id')
      }),
			columnHelper.display({
        header: t('common:detail'),
        id: 'detail button',
        cell: (cell) => {
          const workspaceId = cell.row.original.workspaceId;
          return <WorkspaceDetailButton workspaceId={workspaceId} />
        }
      })
      // columnHelper.accessor((row) =>, {
      //   id: t('common:status'),
      //   header: customTh(),
      //   cell(props) {
      //     const status = props.cell.getValue();
      //     return <DomainStatus status={'all'} />;
      //   }
      // })
    ];
  }, [t]);
  const table = useReactTable({
    data,
    state: {
      columnPinning: {
        // left: [TableHeaderID.APPName],
        // right: [TableHeaderID.Handle]
      },
			columnFilters
    },
    columns,
		getFilteredRowModel: getFilteredRowModel(),
    getCoreRowModel: getCoreRowModel()
  });
  return <BaseTable {...props} table={table}></BaseTable>;
}