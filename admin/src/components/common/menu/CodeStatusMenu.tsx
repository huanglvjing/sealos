import { FlexProps } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { CodeStatusEnum } from '~/@types/redemptionCode';
import BaseMenu from './BaseMenu';

function CodeStatusMenu({
  isDisabled,
  width = '360px',
  status = CodeStatusEnum.Enum.all,
  onUpdateStatus,
  ...props
}: {
  status: CodeStatusEnum;
  onUpdateStatus: (status: CodeStatusEnum) => void;
  isDisabled: boolean;
} & FlexProps) {
  const [idx, setIdx] = useState(CodeStatusEnum.options.findIndex(v=>v===status));
  const { t } = useTranslation();
  const itemList = CodeStatusEnum.options.map(v=>t(`redemptionCode:code_status.${v}`));
  const setItem = 
    function (idx: number) {
      setIdx(idx);
      onUpdateStatus(CodeStatusEnum.options[idx]!);
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

export default CodeStatusMenu;
