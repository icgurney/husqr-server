import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { Prisma } from "@prisma/client";
import {
  PRISMA_CONNECT_ERROR_CODE,
  PRISMA_CONNECT_MULTI_ERROR_CODE,
} from "../../plugins/prisma";

const likes: FastifyPluginAsyncTypebox = async (fastify): Promise<void> => {
  // get likes for a husq
  fastify.get(
    "/:id/likes",
    {
      schema: {
        params: Type.Object({
          id: Type.Number(),
        }),
        querystring: Type.Object({
          cursor: Type.Optional(Type.Number()),
        }),
        tags: ["husqs"],
        summary: "get likes for a husq",
      },
    },
    async function (request, reply) {
      const { id } = request.params;
      const { cursor } = request.query;
      try {
        if (cursor) {
          const result = await fastify.prisma.husq.findUnique({
            where: {
              id: id,
            },
            select: {
              likes: {
                take: 5,
                skip: 1,
                cursor: {
                  id: cursor,
                },
              },
            },
          });
          return result ? result.likes : reply.notFound();
        } else {
          const result = await fastify.prisma.husq.findUnique({
            where: {
              id: id,
            },
            select: {
              likes: {
                take: 5,
              },
            },
          });
          return result ? result.likes : reply.notFound();
        }
      } catch (e) {
        request.log.error(e);
        return reply.internalServerError();
      }
    }
  );

  // like a husq
  fastify.post(
    "/:id/likes",
    {
      schema: {
        params: Type.Object({
          id: Type.Number(),
        }),
        tags: ["husqs"],
        summary: "like a husq",
      },
    },
    async function (request, reply) {
      const { id } = request.params;
      try {
        const husqToLike = await fastify.prisma.husq.findUnique({
          where: {
            id: id,
          },
        });
        if (!husqToLike) return reply.notFound();
        if (husqToLike.authorId === request.user.id) return reply.badRequest();
        const result = await fastify.prisma.husq.update({
          where: {
            id: id,
          },
          data: {
            likes: {
              connect: {
                id: request.user.id,
              },
            },
          },
          select: {
            likes: {
              take: 1,
              cursor: {
                id: request.user.id,
              },
            },
          },
        });
        return result ? result.likes : reply.notFound();
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (
            e.code === PRISMA_CONNECT_ERROR_CODE ||
            e.code === PRISMA_CONNECT_MULTI_ERROR_CODE
          ) {
            return reply.notFound();
          }
        }
        request.log.error(e);
        return reply.internalServerError();
      }
    }
  );

  // unlike a husq
  fastify.delete(
    "/:id/likes/:me",
    {
      schema: {
        params: Type.Object({
          id: Type.Number(),
          me: Type.Number(),
        }),
        tags: ["husqs"],
        summary: "unlike a husq",
      },
      preHandler: fastify.auth([fastify.verifyTokenUserIsParamsMe]) as any,
    },
    async function (request, reply) {
      const { id, me } = request.params;
      try {
        const husqToLike = await fastify.prisma.husq.findUnique({
          where: {
            id: id,
          },
        });
        if (!husqToLike) return reply.notFound();
        if (husqToLike.authorId === request.user.id) return reply.badRequest();
        const result = await fastify.prisma.husq.update({
          where: {
            id: id,
          },
          data: {
            likes: {
              disconnect: {
                id: me,
              },
            },
          },
          select: {
            likes: {
              take: 1,
              cursor: {
                id: me,
              },
            },
          },
        });
        return result ? result.likes : reply.notFound();
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (
            e.code === PRISMA_CONNECT_ERROR_CODE ||
            e.code === PRISMA_CONNECT_MULTI_ERROR_CODE
          ) {
            return reply.notFound();
          }
        }
        request.log.error(e);
        return reply.internalServerError();
      }
    }
  );
};

export default likes;
