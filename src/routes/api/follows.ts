import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";

const follows: FastifyPluginAsyncTypebox = async (fastify): Promise<void> => {
  // get users a user with :id is following
  fastify.get(
    "/:id/follows",
    {
      schema: {
        params: Type.Object({
          id: Type.Number(),
        }),
        querystring: Type.Object({
          cursor: Type.Optional(Type.Number()),
        }),
        tags: ["users"],
        summary: "get users a user with :id is following",
      },
    },
    async function (request, reply) {
      const { id } = request.params;
      const { cursor } = request.query;
      try {
        if (cursor) {
          const result = await fastify.prisma.user.findUnique({
            where: { id: id },
            select: {
              follows: {
                take: 5,
                skip: 1,
                cursor: {
                  id: cursor,
                },
              },
            },
          });
          return result ? result.follows : reply.notFound();
        } else {
          const result = await fastify.prisma.user.findUnique({
            where: { id: id },
            select: {
              follows: { take: 5 },
            },
          });
          return result ? result.follows : reply.notFound();
        }
      } catch (e) {
        request.log.error(e);
        return reply.internalServerError();
      }
    }
  );
};

export default follows;
