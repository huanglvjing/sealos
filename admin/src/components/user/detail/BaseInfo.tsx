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
	Tr
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import ArticleIcon from '~/components/common/icon/ArticleIcon';
import { api } from '~/utils/api';
const InfoTable = ({
  headers,
  cells,
  ...props
}: {
  headers: string[];
  cells: string[];
} & TableContainerProps) => {
  return (
    <TableContainer
      w="100%"
      mt="0px"
      flex={'1'}
      // h="0"
      overflowY={'auto'}
      {...props}
    >
      <Table variant="simple" fontSize={'12px'} width={'full'}>
        <Thead>
          <Tr>
            {headers.map((header) => {
              return (
                <Th
                  py="13px"
                  px={'24px'}
                  top={'0'}
                  position={'sticky'}
                  key={header}
                  bg={'grayModern.100'}
                  color={'grayModern.600'}
                >
                  {header}
                </Th>
              );
            })}
          </Tr>
        </Thead>
        <Tbody whiteSpace={'nowrap'}>
          <Tr fontSize={'12px'}>
            {cells.map((cell, i) => {
              return (
                <Td py="10px" key={cell} px={'24px'}>
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
  const detailResult = api.user.getUserDetail.useQuery({
    id
  });

  const { t } = useTranslation();
  const baseInfoHeader = [
    t('common:nickname'),
    t('common:user_id'),
    t('common:real_name'),
    t('common:phone'),
    t('common:email')
  ];
  // eslint-disable-next-line react-hooks/rules-of-hooks
  // const { baseInfo, costInfo } = useMemo(() => {
  const baseInfo = detailResult.data
    ? [
        detailResult.data.nickname,
        detailResult.data.id,
        detailResult.data.realName ?? '',
        detailResult.data.phone ?? '',
        detailResult.data.email ?? ''
      ]
    : [];

  return (
    <Box {...props}>
      <Flex gap={'8px'} px={'8px'} mb={'12px'} align={'center'}>
        <ArticleIcon boxSize={'20px'} />
        <Text fontSize={'16px'} fontWeight={500}>
          {t('common:base_info')}
        </Text>
      </Flex>
      <InfoTable headers={baseInfoHeader} cells={baseInfo}></InfoTable>
    </Box>
  );
}
