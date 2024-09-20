import { PrismaClient as GlobalPrismaClient } from 'prisma/generated/global-client';
import { PrismaClient as RegionPrismaClient } from 'prisma/generated/region-client';

export const globalPrisma = new GlobalPrismaClient();
export const regionPrisma = new RegionPrismaClient();
