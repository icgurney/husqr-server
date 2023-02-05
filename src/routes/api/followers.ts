import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { HeadersSchema } from "./schema";
import { Type } from "@sinclair/typebox";
import { Prisma } from "@prisma/client";
import {
  PRISMA_CONNECT_ERROR_CODE,
  PRISMA_CONNECT_MULTI_ERROR_CODE,
} from "../../plugins/prisma";

const followers: FastifyPluginAsyncTypebox = async (fastify): Promise<void> => {
  // get followers of a user
  fastify.get(
    "/:id/followers",
    {
      schema: {
        headers: HeadersSchema,
        params: Type.Object({
          id: Type.Number(),
        }),
        querystring: Type.Object({
          cursor: Type.Optional(Type.Number()),
        }),
      },
    },
    async function (request, reply) {
      const { id } = request.params;
      const { cursor } = request.query;
      try {
        if (cursor) {
          const result = await fastify.prisma.user.findUnique({
            where: {
              id: id,
            },
            select: {
              followers: { take: 5, skip: 1, cursor: { id: cursor } },
            },
          });
          return result ? result.followers : reply.notFound();
        } else {
          const result = await fastify.prisma.user.findUnique({
            where: {
              id: id,
            },
            select: {
              followers: { take: 5 },
            },
          });
          return result ? result.followers : reply.notFound();
        }
      } catch (e) {
        request.log.error(e);
        return reply.internalServerError();
      }
    }
  );

  // follow a user
  fastify.post(
    "/:id/followers",
    {
      schema: {
        headers: HeadersSchema,
        params: Type.Object({
          id: Type.Number(),
        }),
      },
    },
    async function (request, reply) {
      const { id: userToFollowId } = request.params;
      if (userToFollowId === request.user.id) return reply.badRequest();
      try {
        const result = await fastify.prisma.user.update({
          where: { id: userToFollowId },
          data: {
            followers: {
              connect: {
                id: request.user.id,
              },
            },
          },
          select: {
            followers: {
              take: 1,
              cursor: {
                id: request.user.id,
              },
            },
          },
        });
        return result ? result.followers : reply.notFound();
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

  // unfollow a user
  fastify.delete(
    "/:id/followers/:me",
    {
      schema: {
        headers: HeadersSchema,
        params: Type.Object({
          id: Type.Number(),
          me: Type.Number(),
        }),
      },
      preHandler: fastify.auth([fastify.verifyTokenUserIsParamsMe]) as any,
    },
    async function (request, reply) {
      const { id, me } = request.params;
      if (id === me) return reply.badRequest();
      try {
        const result = await fastify.prisma.user.update({
          where: {
            id: id,
          },
          data: {
            followers: {
              disconnect: {
                id: me,
              },
            },
          },
          select: {
            followers: {
              take: 1,
              cursor: {
                id: me,
              },
            },
          },
        });
        return result ? result.followers : reply.notFound();
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

export default followers;
