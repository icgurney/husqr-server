import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { HeadersSchema } from "./schema";
import { Type } from "@sinclair/typebox";

const timelines: FastifyPluginAsyncTypebox = async (fastify): Promise<void> => {
  // a timeline is a list of husqs from followed users
  fastify.get(
    "/",
    {
      schema: {
        headers: HeadersSchema,
        querystring: Type.Object({
          cursor: Type.Optional(Type.Number()),
        }),
      },
    },
    async function (request, reply) {
      try {
        const { cursor } = request.query;
        if (cursor) {
          return await fastify.prisma.husq.findMany({
            take: 10,
            skip: 1,
            cursor: {
              id: cursor,
            },
            where: {
              deleted: false,
              reply: null,
              author: {
                followers: {
                  some: {
                    id: request.user.id,
                  },
                },
              },
            },
            include: {
              _count: {
                select: {
                  likes: true,
                  replies: true,
                },
              },
            },
            orderBy: {
              id: "desc",
            },
          });
        } else {
          return await fastify.prisma.husq.findMany({
            take: 10,
            where: {
              deleted: false,
              reply: null,
              author: {
                followers: {
                  some: {
                    id: request.user.id,
                  },
                },
              },
            },
            include: {
              _count: {
                select: {
                  likes: true,
                  replies: true,
                },
              },
            },
            orderBy: {
              id: "desc",
            },
          });
        }
      } catch (e) {
        request.log.error(e);
        return reply.internalServerError();
      }
    }
  );
};

export default timelines;