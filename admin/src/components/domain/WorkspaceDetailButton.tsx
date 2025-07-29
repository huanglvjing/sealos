import { Button, Text } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import ParagraphaIcon from '../common/icon/ParagraphIcon';

export default function WorkspaceDetailButton({ workspaceId }: { workspaceId?: string }) {
  const router = useRouter();
	const {t} = useTranslation()
	
  return (
    <Button
      variant={'detail'}
      gap={'4px'}
      px={'8px'}
      py="6px"
      h="unset"
      onClick={(e) => {
				if(workspaceId) router.push(`/user?workspaceId=${workspaceId}`);
      }}
      _disabled={{
        opacity: '0.5',
        pointerEvents: 'none'
      }}
    >
      <ParagraphaIcon boxSize={'12px'}  fill={'currentcolor'} />
      <Text>{t("common:details")}</Text>
    </Button>
  );
}
