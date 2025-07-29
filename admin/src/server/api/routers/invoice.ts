import { TRPCError } from '@trpc/server';
import { Readable } from 'stream';
import { z } from "zod";
import { InvoiceEntityStatusEnum, InvoiceEntityStatusToInvoiceStatus, InvoiceStatusEnum, TInvoiceData } from '~/@types/invoice';
import { PaginationSchema } from '~/@types/page';
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import { emaildefaultConfig, emailTransporter } from '~/server/sms';
import { uploadInvoiceSchema } from '~/utils/schema';
const QuerySchema = z.object({
	status: InvoiceStatusEnum.default("all").transform(val => {
		if (val === 'canceled') return InvoiceEntityStatusEnum.Enum.REJECTED
		else if (val === 'completed') return InvoiceEntityStatusEnum.Enum.COMPLETED
		else if (val === 'pending') return InvoiceEntityStatusEnum.enum.PENDING
		else return undefined
	}),
	// domain: z.string().optional()
}).merge(PaginationSchema)

export const invoiceRouter = createTRPCRouter({
	getInvoiceList: privateProcedure
		.input(
			QuerySchema
		)
		.query(async ({ ctx, input }) => {
			const { pageIndex, pageSize, status } = input;

			const offset = pageIndex * pageSize;
			const result = await ctx.db.globalPrisma.invoice.findMany({
				take: pageSize,
				skip: offset,
				orderBy: {
					created_at: "desc"
				},
				where: status ? {
					status
				}: undefined,
			});
			const count = await ctx.db.globalPrisma.invoice.count({
				where: {
					status
				}
			});
			const totalPages = Math.ceil(count / pageSize);
			return {
				list: result.map(v => ({ ...v, detail: JSON.parse(v.detail) as TInvoiceData, status: InvoiceEntityStatusToInvoiceStatus(v.status as InvoiceEntityStatusEnum) })),
				pageIndex,
				pageSize,
				totalItems: count,
				totalPages
			};
		}),
	sendInvoice: privateProcedure
		.input(
			uploadInvoiceSchema
		)
		.mutation(async ({ ctx, input }) => {
			const { file, id } = input
			const fileStream = Readable.fromWeb(
				// @ts-expect-error
				file.stream()
			)
			const detail = await ctx.db.globalPrisma.invoice.findUnique({
				where: {
					id
				}
			})
			if (!detail) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Invoice not found'
				})
			}
			const data = JSON.parse(detail.detail) as TInvoiceData
			const { email } = data.contract
			// send message
			const config = structuredClone(emaildefaultConfig)
			config.attachments = [
				{
					filename: file.name,
					content: fileStream,
				}
			]
			//
			config.to = ctx.email.testTo ?? email
			// send message
			const mailResult = await emailTransporter.sendMail(config)
			// update db
			await ctx.db.globalPrisma.invoice.update({
				where: {
					id
				},
				data: {
					status: InvoiceEntityStatusEnum.Enum.COMPLETED
				}
			})
		}),
})