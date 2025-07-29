import { IconButton, TableProps } from '@chakra-ui/react';
import { LinkIcon, useMessage } from '@sealos/ui';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';
import { api, RouterOutputs } from '~/utils/api';
import { BaseTable } from '../common/table/BaseTable';
import UserDetailButton from './UserDetailButton';
export function UserTable({
  data = [],
  ...props
}: { data: RouterOutputs['user']['getUserList']['userList'] } & TableProps) {
  const toast = useMessage();
  const getTokenMutation = api.user.getToken.useMutation();
	const {t} = useTranslation()
  const columns = useMemo(() => {
    const columnHelper =
      createColumnHelper<RouterOutputs['user']['getUserList']['userList'][number]>();
    return [
      columnHelper.accessor((row) => row.nickname, {
        header: t('common:nickname'),
        id: 'nickname'
      }),
      columnHelper.accessor((row) => row.id, {
        header: t('common:user_id'),
        id: 'username',
      }),
      columnHelper.accessor((row) => row.email, {
        header: t('common:email'),
        id: 'email'
      }),
      columnHelper.accessor((row) => row.phone, {
        header: t('common:phone'),
        id: 'phone'
      }),
      columnHelper.display({
        header: t('common:token_url'),
        id: 'tokenurl',
        cell: (cell) => {
          const userId = cell.row.original.id;
          // !todo 生成token
          return (
            <IconButton
              variant={'white-bg-icon'}
              boxSize={'24px'}
              onClick={async () => {
                try {
                  const url = await getTokenMutation.mutateAsync({ id: userId });
                  if (!url) throw new Error('url is null');
                  await navigator.clipboard.writeText(url);
                  toast.message({
                    title: t('common:copy_success_open_in_browser'),
                    status: 'success'
                  });
                } catch (e) {
                  toast.message({
                    title: t('common:copy_failed'),
                    status: 'error'
                  });
                }
              }}
              aria-label={'get url '}
              icon={<LinkIcon boxSize={'16px'} color={'grayModern.600'} />}
            ></IconButton>
          );
        }
      }),
      columnHelper.display({
        header: t('common:detail'),
        id: 'detail button',
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
  return <BaseTable table={table} h="auto" {...props} />;
}
