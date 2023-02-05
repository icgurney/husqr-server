import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { HeadersSchema } from "./schema";
import { Type } from "@sinclair/typebox";

const replies: FastifyPluginAsyncTypebox = async (fastify): Promise<void> => {
  // get replies to a husq
  fastify.get(
    "/:id/replies",
    {
      schema: {
        headers: HeadersSchema,
        params: Type.Object({ id: Type.Number() }),
        querystring: Type.Object({
          cursor: Type.Optional(Type.Number()),
        }),
      },
    },
    async function (request, reply) {
      try {
        const { id } = request.params;
        const { cursor } = request.query;
        if (cursor) {
          return await fastify.prisma.husq.findMany({
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
            },
            orderBy: {
              id: "asc",
            },
          });
        } else {
          return await fastify.prisma.husq.findMany({
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
            },
            orderBy: {
              id: "asc",
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

export default replies;
