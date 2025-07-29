import { CustomObjectsApi, KubeConfig, V1ListMeta } from "@kubernetes/client-node";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { IncomingMessage } from "http";
import { z } from "zod";
import { announcementEnum } from "~/@types/announcement";
import { NotificationApiGroup, NotificationApiVersion, NotificationCR, NotificationKind, NotificationNamespace, NotificationPlural, version } from "~/@types/kubernetes";
import { InfinityPaginationSchema } from "~/@types/page";
import { regionSchema } from "~/@types/region";
import { createTRPCRouter, otherRegionMiddlewareFactory, privateProcedure } from "~/server/api/trpc";


const createAnnouncementSchema = z.object({
	type: announcementEnum.default(announcementEnum.Enum.event),
	text: z.string(),
})
const listAnnouncementSchema = InfinityPaginationSchema
const getAnnouncementSchema = z.object({
	name: z.string(),
})
export const announcementRouter = createTRPCRouter({
	createAnnuncement: privateProcedure
		.input(regionSchema)
		.use(otherRegionMiddlewareFactory('mutation'))
		.input(
			createAnnouncementSchema
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const result = await createNotfication(input)
				return {
					status: result.body
				};
			} catch (_error: any) {	
				let message = 'unkonwn error'
				if(_error.body) {
					message = _error.body.message
					console.log(_error.body)
				}
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message
				})
			}
		}),

	listAnnouncement:
		privateProcedure
			.input(regionSchema)
			.use(otherRegionMiddlewareFactory('query'))
			.input(
				listAnnouncementSchema
			).query(async ({ ctx, input }) => {
				return listLocalAnnouncement(input);
			}),
	getAnnouncement:
		privateProcedure
			.input(regionSchema)
			.use(otherRegionMiddlewareFactory('query'))
			.input(
				getAnnouncementSchema
			).query(async ({ ctx, input }) => {
				const result = await getNotification(input.name)
				return {
					notification: result.body as NotificationCR
				};
			}),
	deleteAnnouncement:
		privateProcedure
			.input(regionSchema)
			.use(otherRegionMiddlewareFactory('mutation'))
			.input(
				getAnnouncementSchema
			).mutation(async ({ ctx, input }) => {
				try {
					const result = await deleteNotification(input.name)
					return {
						status: result.body
					};
				} catch (_error: any) {	
					let message = 'unkonwn error'
					if(_error.body) {
						message = _error.body.message
					}
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message
					})
				}
			}),
})

async function listLocalAnnouncement(input: InfinityPaginationSchema) {
	const result = await listNotification(input.pageSize, input.cursor)
	return {
		list: result.body.items.map(m => ({
			type: m.metadata.labels?.announcementType ?? announcementEnum.Enum.event,
			name: m.metadata.name!,
			createAt: m.metadata.creationTimestamp,
			message: m.spec?.message?.substring(0, 20),
			title: m.spec?.title?.substring(0, 20),
		})),
		nextCursor: result.body.metadata?._continue,
	};
}

function createNotfication({text: title, type: announcementType}: z.infer<typeof createAnnouncementSchema>) {
	const kc = new KubeConfig();
	kc.loadFromDefault()
	const client = kc.makeApiClient(CustomObjectsApi)
	const message = title
	const body: NotificationCR = {
		apiVersion: NotificationApiVersion.value,
		kind: NotificationKind.value,
		metadata: {
			labels: {
				isRead: "false",
				announcementType
			},
			name: `global-notification-${randomUUID()}`,
			namespace: NotificationNamespace.value
		},
		spec: {
			desktopPopup: false,
			from: "sealos",
			i18ns: {
				zh: {
					from: "sealos",
					message,
					title
				}
			},
			importance: "High",
			message,
			title,
			timestamp: new Date().getTime()
		}
	}
	return client.createNamespacedCustomObject(
		NotificationApiGroup.value,
		version.value,
		NotificationNamespace.value,
		NotificationPlural.value,
		body
	)
}
function listNotification(size: number, _continue?: string) {
	const kc = new KubeConfig();
	kc.loadFromDefault()
	const client = kc.makeApiClient(CustomObjectsApi)
	return client.listNamespacedCustomObject(
		NotificationApiGroup.value,
		version.value,
		NotificationNamespace.value,
		NotificationPlural.value,
		undefined,
		undefined,
		_continue,
		undefined,
		undefined,
		size
	) as Promise<{
		response: IncomingMessage,
		body: {
			items: NotificationCR[]
			metadata: V1ListMeta
		}
	}>
}

function getNotification(name: string) {
	const kc = new KubeConfig();
	kc.loadFromDefault()
	const client = kc.makeApiClient(CustomObjectsApi)
	return client.getNamespacedCustomObject(
		NotificationApiGroup.value,
		version.value,
		NotificationNamespace.value,
		NotificationPlural.value,
		name
	)
}
function deleteNotification(name: string) {
	const kc = new KubeConfig();
	kc.loadFromDefault()
	const client = kc.makeApiClient(CustomObjectsApi)
	return client.deleteNamespacedCustomObject(
		NotificationApiGroup.value,
		version.value,
		NotificationNamespace.value,
		NotificationPlural.value,
		name
	)
}
