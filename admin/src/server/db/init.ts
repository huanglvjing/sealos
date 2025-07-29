import * as k8s from '@kubernetes/client-node';

// export const globalPrisma = new GlobalPrismaClient();
// export const regionPrisma = new RegionPrismaClient();

export function newK8sClient() {
  const kc = new k8s.KubeConfig();

  kc.loadFromDefault();

  return kc.makeApiClient(k8s.CoreV1Api);
}

// export const regionMongoClient = await MongoClient.connect(process.env.regionMongodbURI ?? '');
