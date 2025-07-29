// import arrow_icon from '@/assert/Vector.svg';
// import arrorw_icon_disabled from '@/assert/Vector_disbabled.svg';
// import arrow_left_icon from '@/assert/toleft.svg';
// import arrow_left_icon_disabled from '@/assert/toleft_disabled.svg';
import { Button, ButtonProps, Flex, FlexProps, Text } from '@chakra-ui/react';
import { RightArrowIcon } from '@sealos/ui';
import { useTranslation } from 'next-i18next';

export default function SwitchInfinitePage({
  totalPage,
  // totalItem,
  pageSize,
  currentPage,
	setNetxPage,
	setFirstPage,
	setLastedPage,
	setPreviousPage,
  isPreviousData,
  ...props
}: {
  currentPage: number;
  totalPage: number;
  // totalItem: number;
  pageSize: number;
  isPreviousData?: boolean;
  // setCurrentPage: () => void;
	setLastedPage: () => void;
	setFirstPage: () => void;
	setNetxPage: () => void;
	setPreviousPage: () => void;
} & FlexProps) {
  const { t } = useTranslation();
  const switchStyle: ButtonProps = {
    width: '24px',
    height: '24px',
    minW: '0',
    background: 'grayModern.250',
    flexGrow: '0',
    borderRadius: 'full',
    _hover: {
      background: 'grayModern.150',
      minW: '0'
    },
    _disabled: {
      borderRadius: 'full',
      background: 'grayModern.150',
      cursor: 'not-allowed',
      minW: '0'
    }
  };
  return (
    <Flex 								ml={'auto'}
		mr={'0'} h="32px" align={'center'} mt={'20px'} fontSize="14px" {...props}>
      <Flex gap={'8px'}>
        <Button
          {...switchStyle}
          isDisabled={currentPage === 1}
          bg={currentPage !== 1 ? 'grayModern.250' : 'grayModern.150'}
          p="0"
          minW="0"
          boxSize="24px"
          onClick={(e) => {
            e.preventDefault();
            setFirstPage();
          }}
					color={'grayModern.900'}
        >
          <RightArrowIcon boxSize={'6px'} transform={'rotate(180deg)'}  fill={'currentcolor'} />
        </Button>
        <Button
          {...switchStyle}
          isDisabled={currentPage === 1}
          bg={currentPage !== 1 ? 'grayModern.250' : 'grayModern.150'}
          p="0"
          minW="0"
          boxSize="24px"
          onClick={(e) => {
            e.preventDefault();
            setPreviousPage();
          }}
					color={'grayModern.900'}
        >
          <RightArrowIcon boxSize={'6px'} transform={'rotate(180deg)'}  fill={'currentcolor'}/>
        </Button>
        <Text color={'grayModern.500'}>{currentPage}</Text>
        <Text color={'grayModern.500'}>/</Text>
        <Text color={'grayModern.900'}>{totalPage}</Text>
        <Button
          {...switchStyle}
          isDisabled={isPreviousData ?? currentPage >= totalPage}
          bg={currentPage !== totalPage ? 'grayModern.250' : 'grayModern.150'}
          boxSize="24px"
          p="0"
					color={'grayModern.900'}
          minW="0"
          borderRadius={'50%'}
          onClick={(e) => {
            e.preventDefault();
            setNetxPage();
          }}
        >
          <RightArrowIcon boxSize={'6px'}  fill={'currentcolor'}/>
        </Button>
        <Button
          {...switchStyle}
          isDisabled={isPreviousData ?? currentPage >= totalPage}
          bg={currentPage !== totalPage ? 'grayModern.250' : 'grayModern.150'}
          boxSize="24px"
          p="0"
          minW="0"
          borderRadius={'50%'}
          mr={'10px'}
          onClick={(e) => {
            e.preventDefault();
            setLastedPage();
          }}
					color={'grayModern.900'}
        >
          <RightArrowIcon boxSize={'6px'} fill={'currentcolor'}/>
        </Button>
      </Flex>
      <Text fontSize="12px" fontWeight="500" color={'grayModern.900'}>
        {pageSize}
      </Text>
      <Text fontSize="12px" fontWeight="500" color={'grayModern.500'}>
        /{t('common:page')}
      </Text>
    </Flex>
  );
}
