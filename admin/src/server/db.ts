// import { PrismaClient } from "@prisma/client";

import { MongoClient } from 'mongodb';
import { PrismaClient as GlobalPrismaClient } from 'prisma/generated/global-client';
import { PrismaClient as RegionPrismaClient } from 'prisma/generated/region-client';
import { env } from '~/env';

const createGlobalPrismaClient = () =>
  new GlobalPrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
const createRegionalPrismaClient = () =>
  new RegionPrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

const createRegionMongoClient = ()=>new MongoClient(env.regionMongodbURI ?? '');
const globalForPrisma = globalThis as unknown as {
  globalPrisma: ReturnType<typeof createGlobalPrismaClient> | undefined;
  regionalPrisma: ReturnType<typeof createRegionalPrismaClient> | undefined;
  regionMongoClient: ReturnType<typeof createRegionMongoClient> | undefined;
};
export const globalPrisma = globalForPrisma.globalPrisma ?? createGlobalPrismaClient();
export const regionPrisma = globalForPrisma.regionalPrisma ?? createRegionalPrismaClient();
export const regionMongoClient = globalForPrisma.regionMongoClient ?? createRegionMongoClient();

if (env.NODE_ENV !== 'production') {
  globalForPrisma.globalPrisma = globalPrisma;
  globalForPrisma.regionalPrisma = regionPrisma;
  globalForPrisma.regionMongoClient = regionMongoClient;
}
