import { Button, Text } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import ParagraphaIcon from '../common/icon/ParagraphIcon';

export default function UserDetailButton({ userId }: { userId: string }) {
  const router = useRouter();
	const {t} = useTranslation()
  return (
    <Button
		  // variant={'secondary'}
      variant={'detail'}
      gap={'4px'}
      px={'8px'}
      py="6px"
      h="unset"
      onClick={(e) => {
        router.push(`/user/detail/${userId}`);
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
