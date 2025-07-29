import { Circle, Flex, FlexProps, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { CodeStatusEnum } from '~/@types/redemptionCode';

export function CodeStatus({
  status,
  ...props
}: { status: CodeStatusEnum } & FlexProps) {
  const { t } = useTranslation();
  return (
    <Flex
      px="12px"
      py="6px"
      display={'inline-flex'}
      gap={'5px'}
      borderRadius={'33px'}
      alignItems={'center'}
      {...(status === 'used'
        ? {
            color: 'grayModern.700',
            bgColor: 'grayModern.100'
          }
        : {
            color: 'adora.600',
            bgColor: 'adora.50'
          })}
      {...props}
    >
      <Circle bgColor={'currentcolor'} size="6px"></Circle>
      <Text fontWeight={'500'} fontSize={'11px'}>
        {t(`redemptionCode:code_status.${status}`)}
      </Text>
    </Flex>
  );
}
