
import { Button, ButtonProps, Flex, FormControl, FormLabel, IconButton, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { CloseIcon, useMessage } from '@sealos/ui';
import { Field, FieldProps, Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { InvoiceTypeEnum, TInvoiceData } from '~/@types/invoice';
import { api } from '~/utils/api';
import ParagraphaIcon from '../common/icon/ParagraphIcon';
import PdfIcon from '../common/icon/PdfIcon';
import UploadIcon from '../common/icon/UploadIcon';

export default function InvoiceDetailsModal({
	invoice,
	invoiceId,
	totalAmount,
	userId,
	...props
}: {
	invoice: TInvoiceData;
	invoiceId: string;
	userId: string;
	totalAmount: number;
	// toInvoiceDetail: () => void;
} & ButtonProps) {
	// const { setInvoiceDetail, setData } = useInvoiceStore();
	const { t } = useTranslation();
	const { onOpen, isOpen, onClose: _onClose } = useDisclosure();
	const router = useRouter();
	const onClose = () => {
		_onClose();
	};
	const utils = api.useUtils()
	
	type TinputSchema = {
		invoiceFile: File | null
	}
	const kv: [string, string][] = useMemo(() => [
		[t('common:user_id'), userId],
		[t("invoice:billing_id"), invoiceId],
		[t("invoice:invoice_title"), invoice.detail.title],
		[t("invoice:invoice_type._self"), t(`invoice:invoice_type.${InvoiceTypeEnum.safeParse(invoice.detail.type).data ?? 'normal'}`)],
		[t("invoice:tax_registration_number"), invoice.detail.tax],
		[t("invoice:bank_name"), invoice.detail.bank],
		[t("invoice:bank_account"), invoice.detail.bankAccount],
		[t("invoice:address"), invoice.detail.address ?? ''],
		[t("common:phone"), invoice.detail.phone ?? ''],
		[t("invoice:fax"), invoice.detail.fax ?? ''],
		[t("common:total_amount"), totalAmount.toString()]
	] as const, [invoice.detail.address, userId, invoice.detail.bank, invoice.detail.bankAccount, invoice.detail.fax, invoice.detail.phone, invoice.detail.tax, invoice.detail.title, invoice.detail.type, invoiceId, t, totalAmount])
	const sendInvoiceMutation = api.invoice.sendInvoice.useMutation()
	// const sendInvoiceTunck = api.invoice.sendInvoiceTunks.useMutation() 
	const toast = useMessage();
	return (
		<>
			{
				<Button
					// variant={'secondary'}
					variant={'detail'}
					gap={'4px'}
					px={'8px'}
					py="6px"
					h="unset"
					onClick={(e) => {
						onOpen();
					}}
					_disabled={{
						opacity: '0.5',
						pointerEvents: 'none'
					}}
				>
					<ParagraphaIcon boxSize={'12px'} fill={'currentcolor'} />
					<Text>{t("common:details")}</Text>
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
						{/* <WarnTriangeIcon boxSize={'24px'} fill={'yellow.500'} /> */}
						<Text>{t('invoice:invoice_details')}</Text>
					</ModalHeader>
					<ModalCloseButton top={'8px'} right={'20px'} />
					<ModalBody h="100%" w="100%" px="52px" pt="32px" color={'grayModern.600'}>
						<Formik<TinputSchema>

							initialValues={{ invoiceFile: null }}
							validateOnChange={false}
							validateOnMount={false}
							validateOnBlur={false}
							onSubmit={async (values, actions) => {
								try {
									if (!values.invoiceFile) {
										toast.message({
											title: t('invoice:please_upload_invoice_file'),
											status: 'error'
										})
										actions.resetForm()
										return;
									}
									actions.setSubmitting(true)
									const formdata = new FormData()
									formdata.append('file', values.invoiceFile!)
									formdata.append('id', invoiceId)
									// const _result = uploadInvoiceSchema.safeParse(formdata)
									// const file = values.invoiceFile!
									await sendInvoiceMutation.mutateAsync(formdata)
									// sendInvoiceTunck.mutateAsync(file)
									// if(result) {
									toast.message({
										title: t('invoice:send_invoice_success'),
										status: 'success'
									})
									
									await utils.invoice.getInvoiceList.invalidate()
									actions.resetForm()
									onClose()
								} catch (e) {
									toast.message({
										title: t('invoice:send_invoice_failed'),
										status:'error'
									})
									actions.resetForm()
								} 
							}}
						>
							{(props) => (
								<Form>
									<VStack gap={'16px'}>
										{kv.map(([k, v], idx) => {
											return (
												<Flex justify={'space-between'} w={'full'} key={k}>
													<Text>{k}</Text>
													<Text color={'grayModern.900'}>{v}</Text>
												</Flex>
											)
										})}
										<Flex justify={'space-between'} w={'full'} align={'center'}>
											<Text>{t("common:email")}</Text>
											<Flex alignItems={'center'} gap={'8px'}>
												<Text>{invoice.contract.email}</Text>
												<Button variant={'solid'}
													px={'14px'}
													isLoading={props.isSubmitting}
													isDisabled={props.isSubmitting}
													py='8px'
													type="submit">
													{t('common:send')}
												</Button></Flex>
										</Flex>
										<Flex justifyContent={'space-between'} alignItems={'center'} w={'full'}>
											<Text >{t('invoice:invoice_file')}</Text>
											<Field name="invoiceFile">
												{({ field, form }: FieldProps<TinputSchema['invoiceFile'], TinputSchema>) => (
													<FormControl
														variant={'unstyled'}
														width={'auto'}
													>
														<FormLabel
															bg="white"
															borderRadius="md"
															fontWeight={500}
															border="1px solid"
															borderColor="grayModern.250"
															boxShadow={"0px 1px 2px 0px rgba(19, 51, 107, 0.05), 0px 0px 1px 0px rgba(19, 51, 107, 0.08)"}
															color="grayModern.600"
															_hover={{
																opacity: 0.9,
																bg: "rgba(33, 155, 244, 0.05)",
																color: "brightBlue.700",
																borderColor: "brightBlue.300"
															}}
															_active={{
																bg: "transparent"
															}}
															pointerEvents={props.isSubmitting ?'none': 'auto'}
															cursor={props.isSubmitting ? 'none': 'pointer'}
															py='8px'
															gap={'6px'}
															display={'flex'}
															px={'14px'}
														>
															<UploadIcon boxSize={'16px'} fill={'currentcolor'} />
															{t("common:upload")}
														</FormLabel>
														<Input
															type='file'
															name={field.name}
															w={0}
															h={0}
															hidden
															// value={field.value?.name ?? ''}
															onChange={(e) => {
																e.preventDefault();
																const files = e.target.files;
																if (files && files.length > 0) {
																	console.log(files)
																	form.setFieldValue('invoiceFile', files[0]);
																}
																// clear input filename 
																e.target.value = ''
															}}
														/>
													</FormControl>
												)}
											</Field>
										</Flex>
										{!!props.values.invoiceFile && <Flex justify={'flex-end'} width={'full'}>
											<Flex
												alignItems={'center'}
												minW={'160px'}
												bgColor={'grayModern.100'}
												py={'6px'}
												gap={'24px'}
												px={'12px'}
												borderRadius={'8px'}
												justifyContent={'space-between'}
											>
												<Flex gap={'8px'}>
													<PdfIcon boxSize={'20px'} fill={'currentcolor'} />
													<Text>
														{
															props.values.invoiceFile?.name
														}
													</Text>
												</Flex>
												<IconButton minW={'unset'} minH={'unset'} variant={'unstyled'}
													boxSize={'24px'}
													icon={<CloseIcon boxSize={'16px'} fill={'black'} />} aria-label={'cancel pdf'} onClick={() => {
														props.setFieldValue('invoiceFile', null)

													}}></IconButton>
											</Flex>
										</Flex>}
									</VStack>
								</Form>
							)}
						</Formik>
					</ModalBody>
				</ModalContent>
			</Modal>
		</>
	);
}