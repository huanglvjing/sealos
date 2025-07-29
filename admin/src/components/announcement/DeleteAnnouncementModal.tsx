import { Button, ButtonProps, Center, Flex, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Spinner, Text, useDisclosure, VStack } from "@chakra-ui/react";
import { WarnTriangeIcon } from "@sealos/ui";
import { useTranslation } from "next-i18next";
import { api } from "~/utils/api";

export default function DeleteAnnouncementModal({ announcementName, regionUid, onClick, ...props }: ButtonProps & {
	announcementName: string;
	regionUid?: string;
}) {
	const mutation = api.announcement.deleteAnnouncement.useMutation();
	const utils = api.useUtils()
	const { onOpen, isOpen, onClose } = useDisclosure();
	const { t } = useTranslation()
	return (<> <Button
		onClick={(e) => {
			console.log('open')
			onOpen();
			onClick?.(e)
		}}
		{...props}
	>
		<Text>{t('common:delete')}</Text>
	</Button>
		<Modal isOpen={isOpen} onClose={onClose} isCentered>
			<ModalOverlay />
			<ModalContent
				borderRadius={'10px'}
				maxW={'400px'}
				bgColor={'#FFF'}
				backdropFilter="blur(150px)"
			>
				<ModalHeader
					px={'20px'}
					py={'12px'}
					bg={'grayModern.25'}
					borderBottom={'1px solid'}
					fontWeight={500}
					fontSize={'16px'}
					display={'flex'}
					gap={'10px'}
					borderColor={'grayModern.100'}
				>
					<WarnTriangeIcon boxSize={'24px'} fill={'yellow.500'} />
					<Text>{t('announcement:delete_tips')}</Text>
				</ModalHeader>
				<ModalCloseButton top={'8px'} right={'20px'} />
				<ModalBody h="100%" w="100%" px="36px" py="24px" fontSize={'14px'}>
					{mutation.isPending ? (
						<Center>
							<Spinner mx="auto" />
						</Center>
					) : (
						<VStack alignItems={'stretch'} gap={'0'} fontWeight={'400'} color={'grayModern.900'}>
							<Text>{t(`announcement:delete_confirm`)}</Text>
							<Flex gap={'12px'} mt={'24px'} justifyContent={'flex-end'}>
								<Button
									variant={'outline'}
									onClick={(e) => {
										e.preventDefault();
										onClose();
									}}
								>
									{t('common:cancel')}
								</Button>
								<Button
									variant={'solid'}
									onClick={async (e) => {
										e.preventDefault();
										await mutation.mutateAsync({
											regionUid,
											name: announcementName,
										});
										utils.announcement.listAnnouncement.invalidate()
										onClose();
									}}
								>
									{t('common:confirm')}
								</Button>
							</Flex>
						</VStack>
					)}
				</ModalBody>
			</ModalContent>
		</Modal></>)
}