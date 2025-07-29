import { FlexProps } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { InvoiceStatusEnum } from '~/@types/invoice';
import BaseMenu from './BaseMenu';

function InvoiceMenu({
  isDisabled,
  width = '360px',
  status = InvoiceStatusEnum.Enum.all,
  onUpdateStatus,
  ...props
}: {
  status: InvoiceStatusEnum;
  onUpdateStatus: (status: InvoiceStatusEnum) => void;
  isDisabled: boolean;
} & FlexProps) {
  const [idx, setIdx] = useState(InvoiceStatusEnum.options.findIndex(v=>v===status));
  const { t } = useTranslation();
  const itemList = InvoiceStatusEnum.options.map(v=>t(`invoice:invoice_status.${v}`));
  const setItem = 
    function (idx: number) {
      setIdx(idx);
      onUpdateStatus(InvoiceStatusEnum.options[idx]!);
    }

  return (
    <BaseMenu
      itemIdx={idx}
      isDisabled={isDisabled}
      setItem={setItem}
      itemlist={itemList}
      innerWidth={width}
    />
  );
}

export default InvoiceMenu;
