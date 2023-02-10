import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { PrismaClient } from "@prisma/client";

// Use TypeScript module augmentation to declare the type of server.prisma to be PrismaClient

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export const PRISMA_CONNECT_ERROR_CODE = "P2016";
export const PRISMA_CONNECT_MULTI_ERROR_CODE = "P2025";
export const PRISMA_FOREIGN_KEY_ERROR_CODE = "P2003";

const prismaPlugin: FastifyPluginAsync = fp(async (fastify, options) => {
  const prisma = new PrismaClient();

  await prisma.$connect();

  // Make Prisma Client available through the fastify server instance: server.prisma

  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async (fastify) => {
    await fastify.prisma.$disconnect();
  });
});

export default prismaPlugin;
