import { V1ObjectMeta } from "@kubernetes/client-node";
import { z } from "zod";
import { announcementEnum } from "./announcement";

export const version = z.literal("v1");


export const NotificationApiGroup = z.literal("notification.sealos.io");
export const NotificationApiVersion = z.literal("notification.sealos.io/v1");
export const NotificationKind = z.literal("Notification");
export const NotificationPlural = z.literal("notifications");
export const NotificationNamespace = z.literal('sealos')

export declare class NotificationMeta extends V1ObjectMeta {
	labels: {
		isRead?: string,
		announcementType?: announcementEnum
	}
	name: string
	namespace?: z.infer<typeof NotificationNamespace>
}

export const NotificationSchema = z.object({  
	apiVersion: NotificationApiVersion,
  kind: NotificationKind,
  metadata: z.custom<NotificationMeta>((input)=>{
		return input instanceof NotificationMeta;
	}),
  spec: z.object({
    desktopPopup: z.boolean(),
    from: z.string(),
    i18ns: z.record(z.object({
      from: z.string(),
      message: z.string(),
      title: z.string(),
    })),
    importance: z.string(),
    message: z.string(),
    timestamp: z.number(),
    title: z.string(),
  }),
});
export type NotificationCR = z.infer<typeof NotificationSchema>;