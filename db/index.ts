import { drizzle } from 'drizzle-orm/netlify-db';
import * as schema from './schema.js';

export function database() {
  try {
    return drizzle({ schema });
  } catch {
    console.warn('[AI Studio] Database not connected — using mock');
    const noOp = {
      findMany: async () => [],
      findFirst: async () => null,
      findUnique: async () => null,
      create: async (d: any) => d?.data ?? {},
      update: async (d: any) => d?.data ?? {},
      delete: async () => ({})
    };
    return new Proxy({} as any, {
      get: (_, prop) => prop === 'query'
        ? new Proxy({}, { get: () => noOp })
        : async () => [],
    });
  }
}
