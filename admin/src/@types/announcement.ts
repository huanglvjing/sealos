import { z } from "zod";
export const announcementEnum = z.enum(["event"]);
export type announcementEnum = z.infer<typeof announcementEnum>;


