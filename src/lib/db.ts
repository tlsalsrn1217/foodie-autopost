import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makePrisma() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

let _instance: PrismaClient | null = globalForPrisma.prisma ?? null;

function getPrisma(): PrismaClient {
  if (_instance) return _instance;
  _instance = makePrisma();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _instance;
  return _instance;
}

// 빌드 단계 import 시점엔 인스턴스 생성하지 않도록 Proxy 로 lazy 초기화
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrisma(), prop, receiver);
  },
});
