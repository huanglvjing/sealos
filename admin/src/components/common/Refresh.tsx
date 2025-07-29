import { Button, ButtonProps } from '@chakra-ui/react';
import { RefreshIcon, useMessage } from '@sealos/ui';
import { useTranslation } from 'next-i18next';

export function Refresh({
  onRefresh,
  ...props
}: {
  onRefresh(): void;
} & ButtonProps) {
	const {t} = useTranslation()
  const toast = useMessage({
    status: 'success',
    title: t("common:refresh_successfully"),
    position: 'top'
  });
  return (
    <Button
      boxSize={'32px'}
      variant={'outline'}
      {...props}
      onClick={async () => {
        try {
					await Promise.resolve(onRefresh());
					toast.message();
				} catch {
					toast.message({
						status: 'error',
						title: t('common:refresh failed')
					});
				}
      }}
    >
      <RefreshIcon boxSize={'24px'} color="grayModern.500" />
    </Button>
  );
}
