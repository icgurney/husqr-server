import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";

const replies: FastifyPluginAsyncTypebox = async (fastify): Promise<void> => {
  // get replies to a husq
  fastify.get(
    "/:id/replies",
    {
      schema: {
        params: Type.Object({ id: Type.Number() }),
        querystring: Type.Object({
          cursor: Type.Optional(Type.Number()),
        }),
        tags: ["husqs"],
      },
    },
    async function (request, reply) {
      try {
        const { id } = request.params;
        const { cursor } = request.query;
        if (cursor) {
          const result = await fastify.prisma.husq.findMany({
            take: 10,
            skip: 1,
            cursor: {
              id: cursor,
            },
            where: {
              replyId: id,
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
              id: "asc",
            },
          });
          return result.map((husq) => ({
            ...husq,
            likes: undefined,
            liked: husq.likes.length > 0,
          }));
        } else {
          const result = await fastify.prisma.husq.findMany({
            take: 10,
            where: {
              replyId: id,
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
              id: "asc",
            },
          });
          return result.map((husq) => ({
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

export default replies;
