import { z } from "zod";

export const GrafanaEnum = z.enum(['consumption', 'ioCluster', 'hzhCluster', 'bjaCluster', 'gzgCluster', 'topCluster', 'sealosBusiness', 'lafBusiness', 'githubStar']);
export type GrafanaEnum = z.infer<typeof GrafanaEnum>;