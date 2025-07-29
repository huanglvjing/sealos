import { Flex, TabPanel, TabPanelProps, Text } from '@chakra-ui/react';
import { keepPreviousData } from '@tanstack/react-query';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { produce } from 'immer';
import { useTranslation } from 'next-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, RouterOutputs } from '~/utils/api';
import CurrencyIcon from '../common/icon/CurrencyIcon';
import SwitchPage from '../common/SwitchPage';
import { BaseTable } from '../common/table/BaseTable';
import UserDetailButton from '../user/UserDetailButton';

export default function UserOverviewPanel(props: TabPanelProps) {
  const [pageState, setPageState] = useState({
    pageSize: 10,
    pageIndex: 1,
    totalPage: 0,
    totalItem: 0
  });
  const userListResult = api.user.getTopUserList.useQuery(
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
    if (!userListResult.isSuccess || userListResult.isFetching) return;
    setPageState({
      pageSize: userListResult.data.pageSize,
      pageIndex: userListResult.data.pageIndex + 1,
      totalPage: userListResult.data.totalPages,
      totalItem: userListResult.data.totalItems
    });
  }, [userListResult.data, userListResult.isFetching, userListResult.isSuccess]);
  const setCurrentPage = useCallback(
    (idx: number): void => {
      const data = produce(pageState, (draft) => {
        draft.pageIndex = idx;
      });
      setPageState(data);
    },
    [pageState]
  );
  const data = userListResult.data?.userList ?? [];
	const {t} = useTranslation()
  const columns = useMemo(() => {
    const columnHelper =
      createColumnHelper<RouterOutputs['user']['getTopUserList']['userList'][number]>();
    return [
      columnHelper.accessor((row) => row.id, {
        header: t('common:user_id'),
        id: 'email',
        cell(props) {
          return (
            <Text color={'grayModern.900'} fontWeight={500}>
              {props.getValue()}
            </Text>
          );
        }
      }),
      columnHelper.accessor((row) => row.phone, {
        header: t('common:phone'),
        id: 'phone',
        cell(props) {
          return <Text color={'grayModern.600'}>{props.getValue()}</Text>;
        }
      }),
      columnHelper.accessor((row) => row.deduction_balance, {
        header(props) {
          return (
            <Flex gap={'4px'}>
              <Text>{t('common:consumption_amount')}</Text>
              <CurrencyIcon boxSize={'14px'} />
            </Flex>
          );
        },
        id: 'deduction_balance',
        cell(props) {
          return <Text color={'brightBlue.600'}>{(props.getValue() / 1_000_000).toFixed(2)}</Text>;
        }
      }),
      columnHelper.display({
        header: t('common:handle'),
        id: 'cell',
        cell: (cell) => {
          const userId = cell.row.original.id;
          return <UserDetailButton userId={userId}></UserDetailButton>;
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
