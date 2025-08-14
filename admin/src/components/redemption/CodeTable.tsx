import { Box, Flex, FlexProps, Text } from '@chakra-ui/react';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { format } from 'date-fns';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';
import { RouterOutputs } from '~/utils/api';
import { RechargeCodeTypeLabels } from '~/@types/user';
import { BaseTable } from '../common/table/BaseTable';

type CodeListItem = RouterOutputs['code']['getCodeList']['list'][0];

export function CodeTable({
  data = [],
  ...props
}: {
  data: CodeListItem[];
} & FlexProps) {
  const { t } = useTranslation();

  const formatDate = (date: Date | null | string) => {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'yyyy-MM-dd');
  };

  const getStatusBadge = (used: boolean) => {
    return (
      <Box
        paddingInline="12px"
        paddingTop="6px"
        paddingBottom="6px"
        display="inline-flex"
        gap="5px"
        borderRadius="33px"
        alignItems="center"
        color={used ? '#383F50' : '#6F5DD7'}
        backgroundColor={used ? '#F5F5F5' : '#F0EFFF'}
      >
        <Box w="6px" h="6px" borderRadius="50%" bg={used ? '#383F50' : '#6F5DD7'} />
        <Text fontSize="14px" color="inherit">
          {used ? '已使用' : '未使用'}
        </Text>
      </Box>
    );
  };

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<CodeListItem>();

    return [
      columnHelper.accessor((row) => row.code, {
        header: '兑换码',
        id: 'code',
        cell: (cell) => (
          <Text
            fontSize="14px"
            fontFamily="mono"
            color="gray.800"
            fontWeight={400}
            wordBreak="break-all"
            w="280px"
          >
            {cell.getValue()}
          </Text>
        )
      }),

      columnHelper.accessor((row) => row.giftCodeCreation?.createdByUser, {
        header: '创建人',
        id: 'creator',
        cell: (cell) => {
          const user = cell.getValue();
          return (
            <Flex direction="column" gap={1}>
              <Text fontSize="14px" fontWeight={400} color="gray.800">
                {user?.realNameInfo?.realName ?? user?.nickname ?? '-'}
              </Text>
              {user?.id && (
                <Text fontSize="12px" color="gray.500" fontFamily="mono">
                  {user.id}
                </Text>
              )}
            </Flex>
          );
        }
      }),

      columnHelper.accessor((row) => row.used, {
        header: '状态',
        id: 'status',
        cell: (cell) => getStatusBadge(cell.getValue())
      }),

      columnHelper.accessor((row) => row.giftCodeCreation?.rechargeType, {
        header: '兑换码类型',
        id: 'rechargeType',
        cell: (cell) => {
          const type = cell.getValue();
          return type ? (
            <Text fontSize="14px" color="gray.600" fontWeight="normal" alignItems="center">
              {RechargeCodeTypeLabels[type as keyof typeof RechargeCodeTypeLabels] || type}
            </Text>
          ) : (
            <Text fontSize="14px" color="gray.400">
              -
            </Text>
          );
        }
      }),

      columnHelper.accessor((row) => row.createdAt, {
        header: '创建时间',
        id: 'createdAt',
        cell: (cell) => (
          <Text fontSize="14px" color="gray.600" fontWeight={400}>
            {formatDate(cell.getValue())}
          </Text>
        )
      }),

      columnHelper.accessor((row) => row.user?.id, {
        header: '使用用户ID',
        id: 'usedBy',
        cell: (cell) => (
          <Text fontSize="14px" color="gray.600" fontWeight={400}>
            {cell.getValue() ?? '-'}
          </Text>
        )
      }),

      columnHelper.accessor((row) => row.comment, {
        header: '备注',
        id: 'comment',
        cell: (cell) => {
          const value = cell.getValue();
          return (
            <Text fontSize="14px" color="gray.600" fontWeight={400} title={value ?? ''}>
              {value ?? '-'}
            </Text>
          );
        }
      })
    ];
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <Box {...props}>
      <BaseTable table={table} h="auto" w="100%" overflowY="auto" />
    </Box>
  );
}
