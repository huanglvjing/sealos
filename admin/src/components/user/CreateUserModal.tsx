import {
  Button,
  ButtonProps,
  Flex,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  Checkbox,
  CheckboxGroup,
  Stack
} from '@chakra-ui/react';
import { AddIcon, useMessage } from '@sealos/ui';
import { Field, FieldProps, Form, Formik } from 'formik';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { z } from 'zod';
import { api } from '~/utils/api';
import { ProductSeriesEnum, ProductSeriesLabels } from '~/@types/user';
import Select, { MultiValue } from 'react-select';

type TinputhSchema = {
  nickname: string;
  phone: string;
  email: string;
  productSeries: string[];
};

type OptionType = {
  value: string;
  label: string;
};

export default function CreateUserModal({ ...props }: ButtonProps) {
  const { onOpen, isOpen, onClose: _onClose } = useDisclosure();
  const router = useRouter();
  const mutation = api.user.createUser.useMutation();

  const formSchema = z
    .object({
      nickname: z.string().min(6, '昵称不能为空且最小6位'),
      phone: z.string().min(11, '手机号不能为空且最小11位'),
      email: z.preprocess(
        (v) => (v === '' ? undefined : v),
        z.string().email('邮箱格式错误').optional()
      ),
      productSeries: z.array(z.string()).optional().default([])
    })
    .required();

  const onClose = () => {
    _onClose();
  };

  const { t } = useTranslation();
  const toast = useMessage();

  const productSeriesOptions = Object.entries(ProductSeriesLabels).map(([key, label]) => ({
    value: key,
    label
  }));

  const selectStyles = {
    control: (provided: any) => ({
      ...provided,
      minHeight: '40px',
      border: '1px solid #E2E8F0',
      borderRadius: '6px',
      '&:hover': {
        borderColor: '#3182CE'
      }
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: '#EBF8FF',
      borderRadius: '4px'
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: '#2B6CB0',
      fontSize: '14px'
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: '#2B6CB0',
      '&:hover': {
        backgroundColor: '#BEE3F8',
        color: '#1A365D'
      }
    })
  };

  return (
    <>
      {
        <Button
          variant={'solid'}
          px={'14px'}
          py={'8px'}
          gap={'6px'}
          onClick={() => {
            onOpen();
          }}
          {...props}
        >
          <AddIcon boxSize={'16px'} />
          <Text>{t('common:create_user')}</Text>
        </Button>
      }
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent
          borderRadius={'10px'}
          maxW={'530px'}
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
            <Text>{t('common:create_user')}</Text>
          </ModalHeader>
          <ModalCloseButton top={'8px'} right={'20px'} />
          <ModalBody h="100%" w="100%" px="52px" pt="32px">
            <Formik<TinputhSchema>
              initialValues={{ phone: '', nickname: '', email: '', productSeries: [] }}
              validateOnChange={false}
              validateOnMount={false}
              validateOnBlur={false}
              onSubmit={async (values, actions) => {
                const result = await formSchema.safeParseAsync(values);
                if (result.error) {
                  const errors = result.error?.flatten().fieldErrors;
                  console.log(errors);
                  if (errors?.nickname) {
                    toast.message({
                      title: errors.nickname.join(''),
                      status: 'error'
                    });
                  } else if (errors?.phone) {
                    toast.message({
                      title: errors.phone.join(''),
                      status: 'error'
                    });
                  } else if (errors?.email) {
                    toast.message({
                      title: errors.email.join(''),
                      status: 'error'
                    });
                  }
                  return;
                }
                try {
                  await mutation.mutateAsync({
                    ...values,
                    productSeries: values.productSeries as (
                      | 'SEALOS'
                      | 'FASTGPT'
                      | 'LAF_SEALAF'
                      | 'AI_PROXY'
                    )[]
                  });
                  toast.message({
                    title: t('common:create_user_success'),
                    status: 'success'
                  });
                  onClose();
                } catch (e) {
                  if (mutation.isError) {
                    toast.message({
                      title: t('common:create_user_failure') + ':' + mutation.error.message,
                      status: 'error'
                    });
                  }
                }
              }}
            >
              {(formikProps) => (
                <Form>
                  <Flex wrap={'wrap'} justifyContent={'space-between'}>
                    <Field name="nickname">
                      {({ field, form }: FieldProps<TinputhSchema['nickname'], TinputhSchema>) => (
                        <FormControl
                          display={'flex'}
                          alignItems={'center'}
                          width={'512px'}
                          mb={'16px'}
                          justifyContent={'space-between'}
                        >
                          <FormLabel width={'100px'}>{t('common:nickname')}</FormLabel>
                          <Input {...field} width={'328px'} />
                        </FormControl>
                      )}
                    </Field>
                    <Field name="email">
                      {({ field, form }: FieldProps<TinputhSchema['email'], TinputhSchema>) => (
                        <FormControl
                          display={'flex'}
                          alignItems={'center'}
                          width={'512px'}
                          mb={'16px'}
                          justifyContent={'space-between'}
                        >
                          <FormLabel width={'100px'}>{t('common:email')}</FormLabel>
                          <Input {...field} width={'328px'} />
                        </FormControl>
                      )}
                    </Field>
                    <Field name="phone">
                      {({ field, form }: FieldProps<TinputhSchema['phone'], TinputhSchema>) => (
                        <FormControl
                          display={'flex'}
                          alignItems={'center'}
                          width={'512px'}
                          mb={'16px'}
                          justifyContent={'space-between'}
                        >
                          <FormLabel width={'100px'}>{t('common:phone')}</FormLabel>
                          <InputGroup width={'328px'} data-group>
                            <InputLeftElement
                              py={'8px'}
                              pl={'12px'}
                              pr={'14px'}
                              borderRight={'1px solid'}
                              width={'unset'}
                              borderColor={'grayModern.200'}
                              _groupHover={{
                                borderColor: 'brightBlue.300'
                              }}
                              _groupFocusWithin={{
                                borderColor: 'brightBlue.500'
                              }}
                              transition={'border-color 0.2s ease-in-out'}
                            >
                              +86
                            </InputLeftElement>
                            <Input {...field} width={'328px'} pl={'60px'} />
                          </InputGroup>
                        </FormControl>
                      )}
                    </Field>

                    {/* 修改为多选下拉框 */}
                    <Field name="productSeries">
                      {({
                        field,
                        form
                      }: FieldProps<TinputhSchema['productSeries'], TinputhSchema>) => (
                        <FormControl
                          display={'flex'}
                          alignItems={'center'}
                          width={'512px'}
                          mb={'16px'}
                          justifyContent={'space-between'}
                        >
                          <FormLabel width={'100px'}>产品序列</FormLabel>
                          <div style={{ width: '328px' }}>
                            <Select
                              isMulti
                              options={productSeriesOptions}
                              value={productSeriesOptions.filter((option: OptionType) =>
                                field.value?.includes(option.value)
                              )}
                              onChange={(selectedOptions: MultiValue<OptionType>) => {
                                const values = selectedOptions
                                  ? selectedOptions.map((option: OptionType) => option.value)
                                  : [];
                                form.setFieldValue('productSeries', values);
                              }}
                              placeholder="请选择产品序列..."
                              noOptionsMessage={() => '无可选项'}
                              styles={selectStyles}
                              isClearable={false}
                              isSearchable={false}
                              closeMenuOnSelect={false}
                            />
                          </div>
                        </FormControl>
                      )}
                    </Field>
                  </Flex>
                  <Flex mt={'36px'} justify={'flex-end'}>
                    <Button variant={'solid'} type="submit" isLoading={mutation.isPending}>
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
