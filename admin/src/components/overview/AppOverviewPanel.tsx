import { TabPanel, TabPanelProps, Text } from '@chakra-ui/react';
import { keepPreviousData } from '@tanstack/react-query';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { produce } from 'immer';
import { useTranslation } from 'next-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, RouterOutputs } from '~/utils/api';
import SwitchPage from '../common/SwitchPage';
import { BaseTable } from '../common/table/BaseTable';

export default function AppOverviewPanel(props: TabPanelProps) {
  // const getTokenMutation = api.user.;

  const [pageState, setPageState] = useState({
    pageSize: 10,
    pageIndex: 1,
    totalPage: 0,
    totalItem: 0
  });
  const appResult = api.appstore.getTopAppList.useQuery(
    {
      amount: 100,
      pageIndex: pageState.pageIndex - 1,
      pageSize: pageState.pageSize
    },
    {
      placeholderData: keepPreviousData
    }
  );
  useEffect(() => {
    if (!appResult.isSuccess || appResult.isFetching) return;
    setPageState({
      pageSize: appResult.data.pageSize,
      pageIndex: appResult.data.pageIndex + 1,
      totalPage: appResult.data.totalPages,
      totalItem: appResult.data.totalItems
    });
  }, [appResult.data, appResult.isFetching, appResult.isSuccess]);
  const setCurrentPage = useCallback(
    (idx: number): void => {
      const data = produce(pageState, (draft) => {
        draft.pageIndex = idx;
      });
      setPageState(data);
    },
    [pageState]
  );
  const data = appResult.data?.appList ?? [];
	const {t} = useTranslation()
  const columns = useMemo(() => {
    const columnHelper =
      createColumnHelper<RouterOutputs['appstore']['getTopAppList']['appList'][number]>();
    return [
      columnHelper.accessor((row) => row.name, {
        header: t('common:app_name') ,
        id: 'appname',
        cell(props) {
          return (
            <Text color={'grayModern.900'}>
              {props.getValue()}
            </Text>
          );
        }
      }),
      columnHelper.accessor((row) => row.count, {
        header: t('applist:deploy_count'),
        id: 'count',
        cell(props) {
          return <Text color={'brightBlue.600'}>{props.getValue()}</Text>;
        }
      })
    ];
  }, [t]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });
  return (
    <TabPanel {...props}>
      <BaseTable table={table}></BaseTable>
      <SwitchPage
        currentPage={pageState.pageIndex}
        totalPage={pageState.totalPage}
        totalItem={pageState.totalItem}
        pageSize={pageState.pageSize}
        setCurrentPage={setCurrentPage}
      />
    </TabPanel>
  );
}
