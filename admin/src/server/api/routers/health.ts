import { env } from "~/env";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
export const healthRouter = createTRPCRouter({
	status: publicProcedure.query(() => {
		env;
		return "ok";
	})
})