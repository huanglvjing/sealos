import {
  Box,
  BoxProps,
  Flex,
  Table,
  TableContainer,
  TableContainerProps,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useDisclosure
} from '@chakra-ui/react';
import Select from 'react-select';
import { useTranslation } from 'next-i18next';
import { useState, useRef } from 'react';
import ArticleIcon from '~/components/common/icon/ArticleIcon';
import { api } from '~/utils/api';
import { ProductSeriesLabels, ProductSeries } from '~/@types/user';

const InfoTable = ({
  headers,
  cells,
  onProductSeriesChange,
  currentProductSeries,
  ...props
}: {
  headers: string[];
  cells: string[];
  onProductSeriesChange?: (newSeries: ProductSeries[]) => void;
  currentProductSeries?: ProductSeries[];
} & TableContainerProps) => {
  const productSeriesOptions = Object.entries(ProductSeriesLabels).map(([key, label]) => ({
    value: key,
    label
  }));

  const columnWidths = [
    '15%', // 昵称
    '25%', // 产品序列
    '15%', // 用户ID
    '15%', // 真实姓名
    '15%', // 手机
    '15%' // 邮箱
  ];

  return (
    <TableContainer w="100%" mt="0px" flex={'1'} overflowY={'auto'} {...props}>
      <Table variant="simple" fontSize={'12px'} width={'full'}>
        <Thead>
          <Tr>
            {headers.map((header, index) => (
              <Th
                py="13px"
                px={'12px'}
                top={'0'}
                position={'sticky'}
                width={columnWidths[index]}
                key={header}
                bg={'grayModern.100'}
                color={'grayModern.600'}
                zIndex={10}
              >
                {header}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody whiteSpace={'nowrap'}>
          <Tr fontSize={'12px'}>
            {cells.map((cell, i) => {
              if (i === 1 && onProductSeriesChange) {
                const currentValues = (currentProductSeries ?? []).map((series) => ({
                  value: series as ProductSeries,
                  label: ProductSeriesLabels[series as keyof typeof ProductSeriesLabels] ?? series
                }));

                return (
                  <Td py="10px" key={cell + i} px={'12px'} width={columnWidths[i]}>
                    <Select
                      isMulti
                      options={productSeriesOptions}
                      value={currentValues as any}
                      onChange={(selectedOptions) => {
                        const newSeries =
                          (selectedOptions as any[])?.map(
                            (option) => option.value as ProductSeries
                          ) || [];
                        onProductSeriesChange(newSeries);
                      }}
                      placeholder="选择产品序列（可多选）"
                      styles={{
                        container: (provided: any) => ({
                          ...provided,
                          width: '100%'
                        }),
                        control: (provided: any, state: any) => ({
                          ...provided,
                          minHeight: '36px',
                          fontSize: '14px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          boxShadow: state.isFocused ? '0 0 0 1px #3B82F6' : 'none'
                        }),
                        option: (provided: any, state: any) => ({
                          ...provided,
                          fontSize: '14px',
                          backgroundColor: state.isSelected || state.isFocused ? '#F3F4F6' : 'white'
                        }),
                        multiValue: (provided: any) => ({
                          ...provided,
                          backgroundColor: '#EFF6FF',
                          borderRadius: '4px'
                        }),
                        menu: (provided: any) => ({
                          ...provided,
                          zIndex: 9999
                        })
                      }}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      isSearchable={false}
                      isClearable={true}
                      closeMenuOnSelect={false}
                    />
                  </Td>
                );
              }

              return (
                <Td py="10px" key={cell + i} px={'12px'} width={columnWidths[i]}>
                  {cell}
                </Td>
              );
            })}
          </Tr>
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default function BaseInfo({ id, ...props }: BoxProps & { id: string }) {
  const detailResult = api.user.getUserDetail.useQuery({ id });
  const accountTypeResult = api.user.getUserAccountType.useQuery({ id });
  const updateProductSeriesMutation = api.user.updateUserProductSeries.useMutation();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pendingProductSeries, setPendingProductSeries] = useState<ProductSeries[]>([]);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const { t } = useTranslation();

  const handleProductSeriesChange = (newSeries: ProductSeries[]) => {
    setPendingProductSeries(newSeries);
    onOpen();
  };

  const handleConfirmSave = async () => {
    try {
      await updateProductSeriesMutation.mutateAsync({
        id,
        productSeries: pendingProductSeries
      });

      toast({
        title: '更新成功',
        status: 'success',
        duration: 2000
      });

      accountTypeResult.refetch();
      onClose();
    } catch (error) {
      toast({
        title: '更新失败',
        description: error instanceof Error ? error.message : String(error),
        status: 'error',
        duration: 2000
      });
      onClose();
    }
  };

  const baseInfoHeader = [
    t('common:nickname'),
    '产品序列',
    t('common:user_id'),
    t('common:real_name'),
    t('common:phone'),
    t('common:email')
  ];

  const baseInfo =
    detailResult.data && accountTypeResult.data
      ? [
          detailResult.data.nickname,
          '',
          detailResult.data.id,
          detailResult.data.realName ?? '',
          detailResult.data.phone ?? '',
          detailResult.data.email ?? ''
        ]
      : [];

  const currentProductSeries = (accountTypeResult.data?.productSeries as ProductSeries[]) || [];

  return (
    <Box {...props}>
      <Flex gap={'8px'} px={'8px'} mb={'12px'} align={'center'}>
        <ArticleIcon boxSize={'20px'} />
        <Text fontSize={'16px'} fontWeight={500}>
          {t('common:base_info')}
        </Text>
      </Flex>

      <InfoTable
        headers={baseInfoHeader}
        cells={baseInfo}
        onProductSeriesChange={handleProductSeriesChange}
        currentProductSeries={currentProductSeries}
      />

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              确认修改产品序列
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text mb={2}>您确定要将产品序列修改为：</Text>
              <Text fontWeight="medium" color="blue.600">
                {pendingProductSeries.length > 0
                  ? pendingProductSeries
                      .map(
                        (series) => ProductSeriesLabels[series as keyof typeof ProductSeriesLabels]
                      )
                      .join(', ')
                  : '暂无'}
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                取消
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleConfirmSave}
                ml={3}
                isLoading={updateProductSeriesMutation.isPending}
              >
                确定
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
