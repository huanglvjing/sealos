import { FlexProps } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';

import { DomainStatusEnum } from '~/@types/domain';
import BaseMenu from './BaseMenu';

function DomainMenu({
  isDisabled,
  width = '360px',
  status,
  onUpdateStatus,
  ...props
}: {
  status: DomainStatusEnum;
  onUpdateStatus: (status?: DomainStatusEnum) => void;
  isDisabled: boolean;
} & FlexProps) {
  const [idx, setIdx] = useState(0);
  const { t } = useTranslation();

  const itemList = DomainStatusEnum.options.map(v=>t(`common:domain_status.${v}`));
  const setItem = 
    function (idx: number) {
      setIdx(idx);
      onUpdateStatus(DomainStatusEnum.options[idx]);
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

export default DomainMenu;
