import { z } from "zod";

export const DomainStatusEnum = z.enum(['all', 'enabled', 'disabled'])
export type DomainStatusEnum = z.infer<typeof DomainStatusEnum>