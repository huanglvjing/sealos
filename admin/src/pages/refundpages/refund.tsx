import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Textarea,
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
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSideProps } from 'next';
import { useState, useRef, useCallback } from 'react';
import { api } from '~/utils/api';

type RefundForm = {
  Id: string;
  refundAmount: number; // 内部存储为最小单位（1000000 = 1元）
  deductAmount: number; // 内部存储为最小单位
  refundReason: string;
};

type FormErrors = {
  Id?: string;
  refundAmount?: string;
  deductAmount?: string;
  refundReason?: string;
};

// 货币单位转换常量
const CURRENCY_UNIT = 1000000; // 1元 = 1000000最小单位

export default function RefundPage() {
  const { t } = useTranslation('common');
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const [formData, setFormData] = useState<RefundForm>({
    Id: '',
    refundAmount: 0,
    deductAmount: 0,
    refundReason: ''
  });

  // 用于显示的金额状态（以元为单位）
  const [displayAmounts, setDisplayAmounts] = useState({
    refundAmount: '',
    deductAmount: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // 重置表单的回调函数
  const resetForm = useCallback(() => {
    setFormData({
      Id: '',
      refundAmount: 0,
      deductAmount: 0,
      refundReason: ''
    });
    setDisplayAmounts({
      refundAmount: '',
      deductAmount: ''
    });
    setErrors({});
  }, []);

  // 使用 tRPC mutation
  const submitRefundMutation = api.refund.submitRefund.useMutation({
    onSuccess: (data) => {
      onClose(); // 关闭确认对话框
      toast({
        title: '退款成功',
        description: data.message || '退款申请已提交成功',
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      // 重置表单
      resetForm();
    },
    onError: (error) => {
      onClose(); // 关闭确认对话框
      toast({
        title: '退款失败',
        description: error.message || '网络错误，请重试',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  });

  // 元转换为最小单位
  const yuanToMinUnit = useCallback((yuan: number): number => {
    return Math.round(yuan * CURRENCY_UNIT);
  }, []);

  // 处理金额输入变化
  const handleAmountChange = useCallback(
    (value: string, field: 'refundAmount' | 'deductAmount') => {
      // 更新显示值
      setDisplayAmounts((prev) => ({
        ...prev,
        [field]: value
      }));

      // 转换并更新内部数据
      const numValue = parseFloat(value) || 0;
      const minUnitValue = yuanToMinUnit(numValue);

      setFormData((prev) => ({
        ...prev,
        [field]: minUnitValue
      }));

      // 清除相关错误
      setErrors((prev) => ({
        ...prev,
        [field]: undefined
      }));
    },
    [yuanToMinUnit]
  );

  // 表单验证
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.Id.trim()) {
      newErrors.Id = '支付ID不能为空';
    }

    if (!formData.refundAmount || formData.refundAmount <= 0) {
      newErrors.refundAmount = '退款金额必须大于0';
    }

    if (formData.deductAmount < 0) {
      newErrors.deductAmount = '扣除金额不能为负数';
    }

    if (!formData.refundReason.trim()) {
      newErrors.refundReason = '退款原因不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // 处理表单提交 - 显示确认对话框
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    // 显示确认对话框
    onOpen();
  }, [validateForm, onOpen]);

  // 确认退款操作
  const handleConfirmRefund = useCallback(() => {
    // 使用 tRPC mutation 提交数据（以最小单位提交）
    submitRefundMutation.mutate({
      Id: formData.Id,
      refundAmount: formData.refundAmount,
      deductAmount: formData.deductAmount,
      refundReason: formData.refundReason
    });
  }, [submitRefundMutation, formData]);

  // 处理输入框变化
  const handleIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, Id: e.target.value }));
    setErrors((prev) => ({ ...prev, Id: undefined }));
  }, []);

  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, refundReason: e.target.value }));
    setErrors((prev) => ({ ...prev, refundReason: undefined }));
  }, []);

  return (
    <Box p="24px" maxW="800px" mx="auto">
      <Card>
        <CardBody>
          <VStack spacing="24px" align="stretch">
            <Heading size="lg" color="grayModern.900">
              退款管理
            </Heading>

            <VStack spacing="16px" align="stretch">
              {/* 支付ID */}
              <FormControl isInvalid={!!errors.Id}>
                <FormLabel color="grayModern.700" fontSize="14px" fontWeight="500">
                  支付ID *
                </FormLabel>
                <Input
                  value={formData.Id}
                  onChange={handleIdChange}
                  placeholder="请输入支付ID"
                  size="md"
                  borderColor="grayModern.200"
                  _focus={{ borderColor: 'blue.500' }}
                />
                <FormErrorMessage fontSize="12px">{errors.Id}</FormErrorMessage>
              </FormControl>

              {/* 退款金额 */}
              <FormControl isInvalid={!!errors.refundAmount}>
                <FormLabel color="grayModern.700" fontSize="14px" fontWeight="500">
                  退款金额 *
                </FormLabel>
                <InputGroup>
                  <NumberInput
                    value={displayAmounts.refundAmount}
                    onChange={(value) => handleAmountChange(value, 'refundAmount')}
                    min={0}
                    precision={2}
                    step={0.01}
                    w="100%"
                  >
                    <NumberInputField
                      placeholder="请输入退款金额"
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
                <FormErrorMessage fontSize="12px">{errors.refundAmount}</FormErrorMessage>
              </FormControl>

              {/* 扣除金额 */}
              <FormControl isInvalid={!!errors.deductAmount}>
                <FormLabel color="grayModern.700" fontSize="14px" fontWeight="500">
                  扣除金额 *
                </FormLabel>
                <InputGroup>
                  <NumberInput
                    value={displayAmounts.deductAmount}
                    onChange={(value) => handleAmountChange(value, 'deductAmount')}
                    min={0}
                    precision={2}
                    step={0.01}
                    w="100%"
                  >
                    <NumberInputField
                      placeholder="请输入扣除金额"
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
                <FormErrorMessage fontSize="12px">{errors.deductAmount}</FormErrorMessage>
              </FormControl>

              {/* 退款原因 */}
              <FormControl isInvalid={!!errors.refundReason}>
                <FormLabel color="grayModern.700" fontSize="14px" fontWeight="500">
                  退款原因 *
                </FormLabel>
                <Textarea
                  value={formData.refundReason}
                  onChange={handleReasonChange}
                  placeholder="请输入退款原因"
                  resize="vertical"
                  minH="100px"
                  borderColor="grayModern.200"
                  _focus={{ borderColor: 'blue.500' }}
                />
                <FormErrorMessage fontSize="12px">{errors.refundReason}</FormErrorMessage>
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
                提交退款申请
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
              确认退款信息
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack spacing="16px" align="stretch">
                <Text fontSize="14px" color="grayModern.600">
                  请仔细核对以下退款信息，确认无误后点击&ldquo;确认提交&rdquo;：
                </Text>

                <Box bg="gray.50" p="16px" borderRadius="8px">
                  <VStack spacing="12px" align="stretch">
                    {/* 支付ID */}
                    <HStack justify="space-between">
                      <Text fontSize="14px" color="grayModern.700" fontWeight="500">
                        支付ID：
                      </Text>
                      <Text fontSize="14px" color="grayModern.900" fontFamily="mono">
                        {formData.Id}
                      </Text>
                    </HStack>

                    <Divider />

                    {/* 退款金额 */}
                    <HStack justify="space-between">
                      <Text fontSize="14px" color="grayModern.700" fontWeight="500">
                        退款金额：
                      </Text>
                      <Text fontSize="14px" color="grayModern.900" fontWeight="600">
                        ¥{displayAmounts.refundAmount}
                      </Text>
                    </HStack>

                    {/* 扣除金额 */}
                    <HStack justify="space-between">
                      <Text fontSize="14px" color="grayModern.700" fontWeight="500">
                        扣除金额：
                      </Text>
                      <Text fontSize="14px" color="grayModern.900" fontWeight="600">
                        ¥{displayAmounts.deductAmount}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>

                {/* 退款原因 */}
                <Box>
                  <Text fontSize="14px" color="grayModern.700" fontWeight="500" mb="8px">
                    退款原因：
                  </Text>
                  <Box
                    bg="gray.50"
                    p="12px"
                    borderRadius="6px"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <Text fontSize="14px" color="grayModern.900" lineHeight="1.4">
                      {formData.refundReason}
                    </Text>
                  </Box>
                </Box>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} size="md" variant="ghost" mr="12px">
                取消
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleConfirmRefund}
                isLoading={submitRefundMutation.isPending}
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
