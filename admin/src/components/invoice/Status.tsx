import { Circle, Flex, FlexProps, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { InvoiceStatusEnum } from '~/@types/invoice';

export function InvoiceStatus({
  status,
  ...props
}: { status: InvoiceStatusEnum } & FlexProps) {
  const { t } = useTranslation();
  return (
    <Flex
      px="12px"
      py="6px"
      display={'inline-flex'}
      gap={'5px'}
      borderRadius={'33px'}
      alignItems={'center'}
      {...(status === 'completed'
        ? {
            color: 'grayModern.700',
            bgColor: 'grayModern.100'
          }
        : {
            color: 'green.600',
            bgColor: 'green.50'
          })}
      {...props}
    >
      <Circle bgColor={'currentcolor'} size="6px"></Circle>
      <Text fontWeight={'500'} fontSize={'11px'}>
        {t(`invoice:invoice_status.${status}`)}
      </Text>
    </Flex>
  );
}
