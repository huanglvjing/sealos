// import { PrismaClient } from "@prisma/client";

import { PrismaClient as GlobalPrismaClient } from 'prisma/generated/global-client';
import { PrismaClient as RegionPrismaClient } from 'prisma/generated/region-client';
import { env } from "~/env";

const createGlobalPrismaClient = () =>
  new GlobalPrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
	const createRegionalPrismaClient = () =>
		new RegionPrismaClient({
			log: 
				env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
		});
const globalForPrisma = globalThis as unknown as {
  globalPrisma: ReturnType<typeof createGlobalPrismaClient> | undefined;
  regionalPrisma: ReturnType<typeof createRegionalPrismaClient> | undefined;
};

export const globalDb = globalForPrisma.globalPrisma ?? createGlobalPrismaClient();
export const regionalDb = globalForPrisma.regionalPrisma ?? createRegionalPrismaClient();
if (env.NODE_ENV !== "production") {
	globalForPrisma.globalPrisma = globalDb;
	globalForPrisma.regionalPrisma = regionalDb;
}
