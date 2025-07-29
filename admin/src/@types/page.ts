import { z } from "zod";

export const InfinityPaginationSchema = z.object({
	pageSize: z.number().int().positive().default(500),
	cursor: z.string().optional()
})
export type InfinityPaginationSchema = z.infer<typeof InfinityPaginationSchema>;
export const PaginationSchema = z.object({
	pageSize: z.number().int().positive().default(500),
	pageIndex: z.number().int().nonnegative().default(0),
})
export type PaginationSchema = z.infer<typeof PaginationSchema>;