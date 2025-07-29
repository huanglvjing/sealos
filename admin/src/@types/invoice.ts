import { z } from "zod";

export const InvoiceStatusEnum = z.enum(['pending', 'completed', 'canceled', 'all'])
export type InvoiceStatusEnum = z.infer<typeof InvoiceStatusEnum>
export const InvoiceEntityStatusEnum = z.enum(['COMPLETED', 'PENDING', 'REJECTED'])
export type InvoiceEntityStatusEnum = z.infer<typeof InvoiceEntityStatusEnum>
export const InvoiceStatusFilterEnum = InvoiceStatusEnum.transform(val => val === 'all' ? '' : val)
export type InvoiceStatusFilterEnum = z.infer<typeof InvoiceStatusFilterEnum>
export function InvoiceEntityStatusToInvoiceStatus(
  status?: InvoiceEntityStatusEnum
): InvoiceStatusEnum{
  if (status === InvoiceEntityStatusEnum.Enum.COMPLETED) return InvoiceStatusEnum.enum.completed
  else if (status === InvoiceEntityStatusEnum.Enum.PENDING) return InvoiceStatusEnum.enum.pending
  else if (status === InvoiceEntityStatusEnum.enum.REJECTED) return InvoiceStatusEnum.enum.canceled
  else return InvoiceStatusEnum.enum.all
}
export function InvoiceStatusToInvoiceEntityStatus(
  status: InvoiceStatusEnum
): InvoiceEntityStatusEnum | undefined{
  if (status === InvoiceStatusEnum.enum.completed) return InvoiceEntityStatusEnum.Enum.COMPLETED
  else if (status === InvoiceStatusEnum.enum.pending) return InvoiceEntityStatusEnum.Enum.PENDING
  else if (status === InvoiceStatusEnum.enum.canceled) return InvoiceEntityStatusEnum.enum.REJECTED
  else return undefined
}

export const InvoiceTypeEnum = z.enum(['normal', 'special'])
export type InvoiceTypeEnum = z.infer<typeof InvoiceTypeEnum>
export type TInvoiceDetail = {
  title: string;
  tax: string;
  bank: string;
  type?: string;
  bankAccount: string;
  address?: string;
  phone?: string;
  fax?: string;
};
export type TInvoiceContract = {
  person: string;
  phone: string;
  email: string;
};
export type TInvoiceData = {
	detail: TInvoiceDetail,
	contract: TInvoiceContract,
}