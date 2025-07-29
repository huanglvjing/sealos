import {
	Box,
	BoxProps,
	ButtonGroup,
	Flex,
	IconButton,
	Popover,
	PopoverBody,
	PopoverContent,
	PopoverTrigger,
	Portal,
	Table,
	TableContainer,
	Tbody,
	Td,
	Text,
	Th,
	Thead,
	Tr
} from '@chakra-ui/react';
import { MoreIcon } from '@sealos/ui';
import { useTranslation } from 'next-i18next';
import RmbIcon from '~/components/common/icon/RmbIcon';
import { api } from '~/utils/api';
import { formatMoney } from '~/utils/format';
import RechargeModal from '../RechargeModal';
const HandleCost = (props: { userId: string }) => {
  // const initRef2 = useRef<HTMLButtonElement>(null);
  return (
    <Popover>
      {({ isOpen, onClose }) => {
        return (
          <>
            <PopoverTrigger>
              <IconButton
                boxSize={'24px'}
                variant={'square'}
                minW={'unset'}
                icon={<MoreIcon boxSize={'16px'}></MoreIcon>}
                aria-label={'handle'}
              ></IconButton>
            </PopoverTrigger>
            <Portal>
              <PopoverContent
                p="0"
                boxShadow={'0px 0px 1px 0px #13336B1A;0px 4px 10px 0px #13336B1A;'}
                w={'auto'}
              >
                <PopoverBody p={'0'}>
                  <ButtonGroup
                    p={'6px'}
                    spacing={'0'}
                    gap={'2px'}
                    w={'100px'}
                    variant={'menu-item'}
                    display={'flex'}
                    flexDir={'column'}
                    alignItems={'flex-start'}
                  >
                    <RechargeModal userId={props.userId} onClick={onClose} />
                    {/* <Button ref={initRef2} onClick={onClose}>
                      退款
                    </Button> */}
                  </ButtonGroup>
                </PopoverBody>
              </PopoverContent>
            </Portal>
          </>
        );
      }}
    </Popover>
  );
};
export default function CostInfo({ id, ...props }: BoxProps & { id: string }) {
  const detailResult = api.user.getUserDetail.useQuery({
    id
  });
  const { t } = useTranslation();
  const costInfoHeader = [t('common:recharge'), t('common:expenditure'), t('common:balance'), t('common:handle')];
  const costInfo: string[] = detailResult.data
    ? ([
        formatMoney(Number(detailResult.data.balance)).toFixed(2),
        formatMoney(Number(detailResult.data.deductionBalance)).toFixed(2),
        formatMoney(
          Number(detailResult.data.balance) - Number(detailResult.data.deductionBalance)
        ).toFixed(2)
      ] as const)
    : [];

  return (
    <Box {...props}>
      <Flex gap={'8px'} px={'8px'} mb={'12px'} align={'center'}>
        <RmbIcon boxSize={'20px'} />
        <Text fontSize={'16px'} fontWeight={500}>
          {t('common:cost_situation')}
        </Text>
      </Flex>
      <TableContainer
        w="100%"
        mt="0px"
        flex={'1'}
        // h="0"
        overflowY={'auto'}
      >
        <Table variant="simple" fontSize={'12px'} width={'full'}>
          <Thead>
            <Tr>
              {costInfoHeader.map((header) => {
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
              {costInfo.map((cell, i) => {
                return (
                  <Td py="10px" key={i} px={'24px'}>
                    {cell}
                  </Td>
                );
              })}
              <Td py="10px" px={'24px'}>
                <HandleCost userId={id}></HandleCost>
              </Td>
            </Tr>
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}
