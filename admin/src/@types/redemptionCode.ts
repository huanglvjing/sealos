import { z } from "zod";

export const CodeStatusEnum = z.enum(['used', 'unused', 'all'])
export type CodeStatusEnum = z.infer<typeof CodeStatusEnum>