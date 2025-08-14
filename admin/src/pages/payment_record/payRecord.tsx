import { useState, useRef, useCallback } from 'react';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Card,
  CardBody,
  Heading,
  FormErrorMessage,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputRightAddon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Divider,
  HStack
} from '@chakra-ui/react';

import { api } from '~/utils/api';

type CorporatePaymentForm = {
  UserUid: string;
  receiptSerialNumber: string;
  payerName: string;
  paymentAmount: number;
  giftAmount: number;
  payDate: string;
  CreationDate: string;
};

type FormErrors = {
  UserUid?: string;
  receiptSerialNumber?: string;
  payerName?: string;
  paymentAmount?: string;
  giftAmount?: string;
  payDate?: string;
  CreationDate?: string;
};

const CURRENCY_UNIT = 1000000; // 1元 = 1000000最小单位

const INITIAL_FORM_DATA: CorporatePaymentForm = {
  UserUid: '',
  receiptSerialNumber: '',
  payerName: '',
  paymentAmount: 0,
  giftAmount: 0,
  payDate: '',
  CreationDate: ''
};

const INITIAL_DISPLAY_AMOUNTS = {
  paymentAmount: '',
  giftAmount: ''
};

const formatDateTimeForAPI = (dateTimeLocal: string): string => {
  if (!dateTimeLocal) return '';

  const date = new Date(dateTimeLocal);

  if (isNaN(date.getTime())) return '';

  return date.toISOString();
};

const formatDateTimeForInput = (isoString: string): string => {
  if (!isoString) return '';

  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function CorporatePaymentPage() {
  const { t } = useTranslation('common');
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const [formData, setFormData] = useState<CorporatePaymentForm>(INITIAL_FORM_DATA);
  const [displayAmounts, setDisplayAmounts] = useState(INITIAL_DISPLAY_AMOUNTS);
  const [errors, setErrors] = useState<FormErrors>({});

  const submitCorporatePaymentMutation = api.corporatePayment.submitCorporatePayment.useMutation({
    onSuccess: (data) => {
      onClose();
      toast({
        title: '对公支付成功',
        description: data.message || '对公支付申请已提交成功',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      resetForm();
    },
    onError: (error) => {
      onClose();
      toast({
        title: '对公支付失败',
        description: error.message || '网络错误，请重试',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  });

  const yuanToMinUnit = useCallback((yuan: number): number => {
    return Math.round(yuan * CURRENCY_UNIT);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setDisplayAmounts(INITIAL_DISPLAY_AMOUNTS);
    setErrors({});
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.UserUid.trim()) {
      newErrors.UserUid = '用户ID不能为空';
    }

    if (!formData.receiptSerialNumber.trim()) {
      newErrors.receiptSerialNumber = '流水号不能为空';
    }

    if (!formData.payerName.trim()) {
      newErrors.payerName = '商户名称不能为空';
    }

    if (!formData.paymentAmount || formData.paymentAmount <= 0) {
      newErrors.paymentAmount = '支付金额必须大于0';
    }

    if (formData.giftAmount < 0) {
      newErrors.giftAmount = '赠送额度不能为负数';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleAmountChange = useCallback(
    (value: string, field: 'paymentAmount' | 'giftAmount') => {
      setDisplayAmounts((prev) => ({ ...prev, [field]: value }));

      const numValue = parseFloat(value) || 0;
      const minUnitValue = yuanToMinUnit(numValue);

      setFormData((prev) => ({ ...prev, [field]: minUnitValue }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [yuanToMinUnit]
  );

  const handleInputChange = useCallback(
    (field: keyof CorporatePaymentForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    onOpen();
  }, [validateForm, onOpen]);

  const handleConfirmPayment = useCallback(() => {
    const paymentData = {
      UserUid: formData.UserUid,
      receiptSerialNumber: formData.receiptSerialNumber,
      payerName: formData.payerName,
      paymentAmount: formData.paymentAmount,
      giftAmount: formData.giftAmount,

      ...(formData.payDate && { payDate: formatDateTimeForAPI(formData.payDate) }),
      ...(formData.CreationDate && { CreationDate: formatDateTimeForAPI(formData.CreationDate) })
    };

    console.log('提交的数据:', paymentData);

    submitCorporatePaymentMutation.mutate(paymentData);
  }, [submitCorporatePaymentMutation, formData]);

  return (
    <Box p="24px" maxW="800px" mx="auto">
      <Card>
        <CardBody>
          <VStack spacing="24px" align="stretch">
            <Heading size="lg" color="grayModern.900">
              对公支付管理
            </Heading>

            <VStack spacing="16px" align="stretch">
              {/* 用户ID */}
              <FormControl isInvalid={!!errors.UserUid}>
                <FormLabel color="grayModern.700" fontSize="14px" fontWeight="500">
                  用户ID *
                </FormLabel>
                <Input
                  value={formData.UserUid}
                  onChange={handleInputChange('UserUid')}
                  placeholder="请输入用户ID"
                  size="md"
                  borderColor="grayModern.200"
                  _focus={{ borderColor: 'blue.500' }}
                />
                <FormErrorMessage fontSize="12px">{errors.UserUid}</FormErrorMessage>
              </FormControl>

              {/* 流水号 */}
              <FormControl isInvalid={!!errors.receiptSerialNumber}>
                <FormLabel color="grayModern.700" fontSize="14px" fontWeight="500">
                  流水号 *
                </FormLabel>
                <Input
                  value={formData.receiptSerialNumber}
                  onChange={handleInputChange('receiptSerialNumber')}
                  placeholder="请输入流水号"
                  size="md"
                  borderColor="grayModern.200"
                  _focus={{ borderColor: 'blue.500' }}
                />
                <FormErrorMessage fontSize="12px">{errors.receiptSerialNumber}</FormErrorMessage>
              </FormControl>

              {/* 商户名称 */}
              <FormControl isInvalid={!!errors.payerName}>
                <FormLabel color="grayModern.700" fontSize="14px" fontWeight="500">
                  商户名称 *
                </FormLabel>
                <Input
                  value={formData.payerName}
                  onChange={handleInputChange('payerName')}
                  placeholder="请输入商户名称"
                  size="md"
                  borderColor="grayModern.200"
                  _focus={{ borderColor: 'blue.500' }}
                />
                <FormErrorMessage fontSize="12px">{errors.payerName}</FormErrorMessage>
              </FormControl>

              {/* 支付金额 */}
              <FormControl isInvalid={!!errors.paymentAmount}>
                <FormLabel color="grayModern.700" fontSize="14px" fontWeight="500">
                  支付金额 *
                </FormLabel>
                <InputGroup>
                  <NumberInput
                    value={displayAmounts.paymentAmount}
                    onChange={(value) => handleAmountChange(value, 'paymentAmount')}
                    min={0}
                    precision={2}
                    step={0.01}
                    w="100%"
                  >
                    <NumberInputField
                      placeholder="请输入支付金额"
                      borderColor="grayModern.200"
                      _focus={{ borderColor: 'blue.500' }}
                      borderRightRadius="0"
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <InputRightAddon
                    color="grayModern.600"
                    bg="grayModern.50"
                    borderColor="grayModern.200"
                  >
                    元
                  </InputRightAddon>
                </InputGroup>
                <FormErrorMessage fontSize="12px">{errors.paymentAmount}</FormErrorMessage>
              </FormControl>

              {/* 赠送额度 */}
              <FormControl isInvalid={!!errors.giftAmount}>
                <FormLabel color="grayModern.700" fontSize="14px" fontWeight="500">
                  赠送额度 *
                </FormLabel>
                <InputGroup>
                  <NumberInput
                    value={displayAmounts.giftAmount}
                    onChange={(value) => handleAmountChange(value, 'giftAmount')}
                    min={0}
                    precision={2}
                    step={0.01}
                    w="100%"
                  >
                    <NumberInputField
                      placeholder="请输入赠送额度"
                      borderColor="grayModern.200"
                      _focus={{ borderColor: 'blue.500' }}
                      borderRightRadius="0"
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <InputRightAddon
                    color="grayModern.600"
                    bg="grayModern.50"
                    borderColor="grayModern.200"
                  >
                    元
                  </InputRightAddon>
                </InputGroup>
                <FormErrorMessage fontSize="12px">{errors.giftAmount}</FormErrorMessage>
              </FormControl>

              {/* 支付时间 */}
              <FormControl isInvalid={!!errors.payDate}>
                <FormLabel color="grayModern.700" fontSize="14px" fontWeight="500">
                  支付时间 (可选)
                </FormLabel>
                <Input
                  type="datetime-local"
                  value={formData.payDate}
                  onChange={handleInputChange('payDate')}
                  size="md"
                  borderColor="grayModern.200"
                  _focus={{ borderColor: 'blue.500' }}
                />
                <Text fontSize="12px" color="grayModern.500" mt="4px">
                  格式示例：2025-08-12 11:47
                </Text>
                <FormErrorMessage fontSize="12px">{errors.payDate}</FormErrorMessage>
              </FormControl>

              {/* 创建时间 */}
              <FormControl isInvalid={!!errors.CreationDate}>
                <FormLabel color="grayModern.700" fontSize="14px" fontWeight="500">
                  创建时间 (可选)
                </FormLabel>
                <Input
                  type="datetime-local"
                  value={formData.CreationDate}
                  onChange={handleInputChange('CreationDate')}
                  size="md"
                  borderColor="grayModern.200"
                  _focus={{ borderColor: 'blue.500' }}
                />
                <Text fontSize="12px" color="grayModern.500" mt="4px">
                  格式示例：2025-08-12 11:47
                </Text>
                <FormErrorMessage fontSize="12px">{errors.CreationDate}</FormErrorMessage>
              </FormControl>
            </VStack>

            {/* 提交按钮 */}
            <Flex justify="flex-end" pt="16px">
              <Button
                onClick={handleSubmit}
                colorScheme="blue"
                size="md"
                px="32px"
                borderRadius="4px"
                fontWeight="500"
                _hover={{ transform: 'translateY(-1px)' }}
                transition="all 0.2s"
              >
                提交对公支付申请
              </Button>
            </Flex>
          </VStack>
        </CardBody>
      </Card>

      {/* 确认对话框 */}
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} size="md">
        <AlertDialogOverlay>
          <AlertDialogContent mx="16px">
            <AlertDialogHeader fontSize="lg" fontWeight="600" color="grayModern.900">
              确认对公支付信息
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack spacing="16px" align="stretch">
                <Text fontSize="14px" color="grayModern.600">
                  请仔细核对以下对公支付信息，确认无误后点击&ldquo;确认提交&rdquo;：
                </Text>

                <Box bg="gray.50" p="16px" borderRadius="8px">
                  <VStack spacing="12px" align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="14px" color="grayModern.700" fontWeight="500">
                        用户ID：
                      </Text>
                      <Text fontSize="14px" color="grayModern.900">
                        {formData.UserUid}
                      </Text>
                    </HStack>

                    <Divider />

                    <HStack justify="space-between">
                      <Text fontSize="14px" color="grayModern.700" fontWeight="500">
                        流水号：
                      </Text>
                      <Text fontSize="14px" color="grayModern.900">
                        {formData.receiptSerialNumber}
                      </Text>
                    </HStack>

                    <Divider />

                    <HStack justify="space-between">
                      <Text fontSize="14px" color="grayModern.700" fontWeight="500">
                        商户名称：
                      </Text>
                      <Text fontSize="14px" color="grayModern.900" fontWeight="600">
                        {formData.payerName}
                      </Text>
                    </HStack>

                    <Divider />

                    <HStack justify="space-between">
                      <Text fontSize="14px" color="grayModern.700" fontWeight="500">
                        支付金额：
                      </Text>
                      <Text fontSize="14px" color="grayModern.900" fontWeight="600">
                        ¥{displayAmounts.paymentAmount}
                      </Text>
                    </HStack>

                    <HStack justify="space-between">
                      <Text fontSize="14px" color="grayModern.700" fontWeight="500">
                        赠送额度：
                      </Text>
                      <Text fontSize="14px" color="grayModern.900" fontWeight="600">
                        ¥{displayAmounts.giftAmount}
                      </Text>
                    </HStack>

                    {(formData.payDate || formData.CreationDate) && (
                      <>
                        <Divider />
                        {formData.payDate && (
                          <HStack justify="space-between">
                            <Text fontSize="14px" color="grayModern.700" fontWeight="500">
                              支付时间：
                            </Text>
                            <Text fontSize="14px" color="grayModern.900">
                              {new Date(formData.payDate).toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                              })}
                            </Text>
                          </HStack>
                        )}
                        {formData.CreationDate && (
                          <HStack justify="space-between">
                            <Text fontSize="14px" color="grayModern.700" fontWeight="500">
                              创建时间：
                            </Text>
                            <Text fontSize="14px" color="grayModern.900">
                              {new Date(formData.CreationDate).toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                              })}
                            </Text>
                          </HStack>
                        )}
                      </>
                    )}
                  </VStack>
                </Box>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} size="md" variant="ghost" mr="12px">
                取消
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleConfirmPayment}
                isLoading={submitCorporatePaymentMutation.isPending}
                loadingText="处理中..."
                size="md"
                fontWeight="500"
              >
                确认提交
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'zh', ['common', 'applist']))
    }
  };
};
