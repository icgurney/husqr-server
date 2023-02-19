import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";

const timelines: FastifyPluginAsyncTypebox = async (fastify): Promise<void> => {
  // a timeline is a list of husqs from followed users
  fastify.get(
    "/",
    {
      schema: {
        querystring: Type.Object({
          cursor: Type.Optional(Type.Number()),
        }),
        tags: ["timelines"],
        summary: "list of husqs from followed users",
      },
    },
    async function (request, reply) {
      try {
        const { cursor } = request.query;
        if (cursor) {
          const timeline = await fastify.prisma.husq.findMany({
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
              likes: {
                where: {
                  id: request.user.id,
                },
              },
            },
            orderBy: {
              id: "desc",
            },
          });
          return timeline.map((husq) => ({
            ...husq,
            likes: undefined,
            liked: husq.likes.length > 0,
          }));
        } else {
          const timeline = await fastify.prisma.husq.findMany({
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
              likes: {
                where: {
                  id: request.user.id,
                },
              },
            },
            orderBy: {
              id: "desc",
            },
          });
          return timeline.map((husq) => ({
            ...husq,
            likes: undefined,
            liked: husq.likes.length > 0,
          }));
        }
      } catch (e) {
        request.log.error(e);
        return reply.internalServerError();
      }
    }
  );
};

export default timelines;
