import {
	Button,
	ButtonProps,
	Flex,
	FormControl,
	FormLabel,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	Text,
	useDisclosure
} from '@chakra-ui/react';
import { useMessage } from '@sealos/ui';
import { useQueryClient } from '@tanstack/react-query';
import { Field, FieldProps, Form, Formik } from 'formik';
import { useTranslation } from 'next-i18next';
import { z } from 'zod';
import { api } from '~/utils/api';
import MyNumberInput from '../common/NumberInput';
type TinputhSchema = {
  amount: 0;
};
export default function RechargeModal({
  userId,
  onClick,
  ...props
}: ButtonProps & { userId: string }) {
  const { onOpen, isOpen, onClose: _onClose } = useDisclosure();
  const mutation = api.user.recharge.useMutation();
  const formSchema = z
    .object({
      amount: z.number().int().max(1000000).min(-1000000)
    })
    .required();
  const onClose = () => {
    _onClose();
  };
  const queryClient = useQueryClient();
  const utils = api.useUtils();
  const toast = useMessage();
	const {t} = useTranslation()
  return (
    <>
      {
        <Button
          // variant={'primary'}
          onClick={(e) => {
            onClick?.(e);
            onOpen();
          }}
          {...props}
        >
          <Text>{t('common:recharge')}</Text>
        </Button>
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
            {/* <WarnTriangeIcon boxSize={'24px'} fill={'yellow.500'} /> */}
            <Text>充值</Text>
          </ModalHeader>
          <ModalCloseButton top={'8px'} right={'20px'} />
          <ModalBody h="100%" w="100%" px="52px" pt="32px">
            <Formik<TinputhSchema>
              initialValues={{ amount: 0 }}
              validateOnChange={false}
              validateOnMount={false}
              validateOnBlur={false}
              onSubmit={async (values, actions) => {
                // console.log(values, actions);
                const result = formSchema.safeParse(values);
                if (!result.success) {
                  toast.message({
                    title: result.error.flatten().fieldErrors.amount,
                    status: 'success'
                  });
                  return;
                }
								
                try {
                  await mutation.mutateAsync({
                    id: userId,
                    amount: values.amount
                  });
                  toast.message({
                    title: t('common:recharge_success'),
                    status: 'success'
                  });
                  await utils.user.getUserDetail.invalidate({
                    id: userId
                  });
									
                  onClose();
                } catch {
                  if (mutation.error) {
                    toast.message({
                      title: t('common:recharge_failure') + mutation.error.message,
                      status: 'error'
                    });
                  }
                }
              }}
            >
              {(props) => (
                <Form>
                  <Flex wrap={'wrap'} justifyContent={'space-between'}>
                    <Field name="amount">
                      {({ field, form }: FieldProps<TinputhSchema['amount'], TinputhSchema>) => {
                        return (
                          <FormControl>
                            <FormLabel mb={'8px'}>{t('common:recharge_amount')}</FormLabel>
                            <MyNumberInput
                              onBlur={field.onBlur}
                              name={field.name}
                              onChange={(str, v) => {
                                console.log(field.value);
                                props.setFieldValue(field.name, v);
                              }}
                              w={'full'}
                            />
                          </FormControl>
                        );
                      }}
                    </Field>
                  </Flex>
                  <Flex mt={'24px'} justify={'flex-end'}>
                    <Button variant={'primary'} type="submit">
                      {t('common:confirm')}
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
