import {
	Button,
	Flex,
	FormControl,
	FormLabel,
	IconButton,
	IconButtonProps,
	Input,
	InputGroup,
	InputRightElement,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	Text,
	useDisclosure
} from '@chakra-ui/react';
import { MoreIcon, useMessage } from '@sealos/ui';
import { Field, FieldProps, Form, Formik } from 'formik';
import { useTranslation } from 'next-i18next';
import { z } from 'zod';
import { api, RouterOutputs } from '~/utils/api';

export default function UpdateQuotaModal({
  nsId,
  userId,
  domain,
  quota,
  onClick,
  ...props
}: Omit<IconButtonProps, 'aria-label'> & {
  nsId: string;
  userId: string;
  quota: RouterOutputs['user']['getQuota'][number]['resourceQuotaInfo']['hard'];
  domain?: string;
}) {
  const { onOpen, isOpen, onClose: _onClose } = useDisclosure();
  const mutation = api.user.updateQuota.useMutation();
  const utils = api.useUtils();
  const formSchema = z.object({
    cpu: z.string().optional(),
    memory: z.string().optional(),
    storage: z.string().optional()
  });
  type TinputSchema = z.infer<typeof formSchema>;
  const onClose = () => {
    _onClose();
  };
	const { t } = useTranslation();
  const toast = useMessage();
  return (
    <>
      {
        <IconButton
          variant={'square'}
          onClick={(e) => {
            onOpen();
          }}
          boxSize={'24px'}
          minW={'unset'}
          icon={<MoreIcon boxSize={'16px'} />}
          aria-label="updateQuota"
          {...props}
        />
      }
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent
          borderRadius={'10px'}
          maxW={'440px'}
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
            <Text>Quota 分配</Text>
          </ModalHeader>
          <ModalCloseButton top={'8px'} right={'20px'} />
          <ModalBody h="100%" w="100%" px="52px" pt="32px">
            <Formik<TinputSchema>
              initialValues={{
                cpu: quota.cpu.value.toString(),
                memory: quota.memory.value.toString(),
                storage: quota.storage.value.toString()
              }}
              validateOnChange={false}
              validateOnMount={false}
              validateOnBlur={false}
              onSubmit={async (values, actions) => {
                const result = formSchema.safeParse(values);
                if (!result.success) {
                  const errors = result.error?.flatten().fieldErrors;
                  if (errors?.cpu) {
                    toast.message({
                      title: errors.cpu,
                      status: 'success'
                    });
                    return;
                  }
                  if (errors?.memory) {
                    toast.message({
                      title: errors.memory,
                      status: 'success'
                    });
                    return;
                  }
                  if (errors?.storage) {
                    toast.message({
                      title: errors.storage,
                      status: 'success'
                    });
                    return;
                  }
                  return;
                }
                try {
									const quotaMap = new Map()
									if(values.cpu && quota.cpu.value.toString() !== values.cpu) quotaMap.set('cpu', {
                      value: parseFloat(values.cpu),
                      unit: quota.cpu.unit
									})
                  if(values.memory && quota.memory.value.toString() !== values.memory) quotaMap.set('memory', {
                      value: parseFloat(values.memory),
                      unit: quota.memory.unit
									})
                  if(values.storage && quota.storage.value.toString() !== values.storage) quotaMap.set('storage', {
                      value: parseFloat(values.storage),
                      unit: quota.storage.unit
									})
                  await mutation.mutateAsync({
                    ns: nsId,
                    domain,
                    quotaMap
                  });
                  toast.message({
                    title: t('common:update_quota_success'),
                    status: 'success'
                  });
                  utils.user.getUser.invalidate({
                    id: userId
                  });
									utils.user.getUserDetail.invalidate({
                    id: userId
                  })
									utils.user.getQuota.invalidate({
                    id: userId
                  })
                  onClose();
                } catch {
                  if (mutation.error) {
                    toast.message({
                      title: t('common:update_quota_failure') + mutation.error.message,
                      status: 'error'
                    });
                  }
                }
              }}
            >
              {(props) => (
                <Form>
                  <Flex wrap={'wrap'} justifyContent={'space-between'} gap={'24px'}>
                    <Field name="cpu">
                      {({ field, form }: FieldProps<TinputSchema['cpu'], TinputSchema>) => {
                        return (
                          <FormControl>
                            <FormLabel mb={'8px'}>{t("common:cpu")}</FormLabel>
                            <InputGroup>
                              <Input {...field} width={'328px'} />
                              <InputRightElement
                                color={'grayModern.600'}
                                fontSize={'12px'}
                                right={'12px'}
                              >
                                {quota.cpu.unit}
                              </InputRightElement>
                            </InputGroup>
                          </FormControl>
                        );
                      }}
                    </Field>
                    <Field name="memory">
                      {({ field, form }: FieldProps<TinputSchema['memory'], TinputSchema>) => {
                        return (
                          <FormControl>
                            <FormLabel mb={'8px'}>{t('common:memory')}</FormLabel>
                            <InputGroup>
                              <Input {...field} width={'328px'} />
                              <InputRightElement
                                color={'grayModern.600'}
                                fontSize={'12px'}
                                right={'12px'}
                              >
                                {quota.memory.unit}
                              </InputRightElement>
                            </InputGroup>
                          </FormControl>
                        );
                      }}
                    </Field>
                    <Field name="storage">
                      {({ field, form }: FieldProps<TinputSchema['storage'], TinputSchema>) => {
                        return (
                          <FormControl>
                            <FormLabel mb={'8px'}>{t("common:storage")}</FormLabel>
                            <InputGroup>
                              <Input {...field} width={'328px'} />
                              <InputRightElement
                                color={'grayModern.600'}
                                fontSize={'12px'}
                                right={'12px'}
                              >
                                {quota.storage.unit}
                              </InputRightElement>
                            </InputGroup>
                          </FormControl>
                        );
                      }}
                    </Field>
                  </Flex>
                  <Flex mt={'24px'} justify={'flex-end'}>
                    <Button variant={'solid'} type="submit">
                      {t("common:confirm")}
                    </Button>
                  </Flex>
                </Form>
              )}
            </Formik>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
