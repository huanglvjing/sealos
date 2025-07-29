import { KubeConfig, NetworkingV1Api } from "@kubernetes/client-node";
import { z } from "zod";
import { DomainStatusEnum } from "~/@types/domain";
import { regionSchema } from "~/@types/region";
import { createTRPCRouter, otherRegionMiddlewareFactory, privateProcedure } from "~/server/api/trpc";
import { apiFactory } from "~/utils/apiFactory";
const PaginationSchema = z.object({
	pageSize: z.number().int().positive().default(500),
	cursor: z.string().optional()
})
const DomainQuerySchema = z.object({
	status: DomainStatusEnum.default("all"),
	// domain: z.string().optional()
}).merge(PaginationSchema)
const DomainRemoteQuerySchema =
	DomainQuerySchema.merge(z.object({ regionDomain: z.string().optional() }))
export const domainRouter = createTRPCRouter({
	getDomain: privateProcedure
		.input(regionSchema)
		.use(otherRegionMiddlewareFactory('query'))
		.input(
			DomainQuerySchema
		).query(async ({ ctx, input }) => {
			return getLocalDomains(input);
		})
})

async function getLocalDomains(input: z.infer<typeof DomainQuerySchema>) {
	const result = await getIngress(input.pageSize, input.cursor)
	// const prismaS = await prisma.workspace.findMany
	return {
		list: result.body.items.map(m => ({
			name: m.metadata?.name,
			domain: m.spec?.rules?.map(v => v.host).filter(v => !!v).join(','),
			workspaceId: m.metadata?.namespace
		})).filter(m => m.name && m.domain && !!m.workspaceId && m.workspaceId.startsWith('ns-')),
		nextCursor: result.body.metadata?._continue,
	};
}

async function getRemoteDomains(input: z.infer<typeof DomainRemoteQuerySchema>) {
	const { regionDomain, ...data } = input;
	const url = `http://${regionDomain}/api/trpc`;
	const client = apiFactory(url, () => `Bearer ` + '');
	return client.query('/_getDomain', data) as ReturnType<typeof getLocalDomains>;
}

function getIngress(size: number, _continue?: string) {
	const kc = new KubeConfig();
	kc.loadFromDefault()
	const client = kc.makeApiClient(NetworkingV1Api)
	return client.listIngressForAllNamespaces(undefined, _continue, undefined, undefined, size)
}

