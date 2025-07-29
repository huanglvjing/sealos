import { z } from "zod";

export const regionSchema = z.object({ regionUid: z.string().uuid().optional()}).passthrough()
export type RegionSchema = z.infer<typeof regionSchema>;