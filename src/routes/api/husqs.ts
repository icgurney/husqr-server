import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import replies from "./replies";
import likes from "./likes";

const husqs: FastifyPluginAsyncTypebox = async (fastify): Promise<void> => {
  // get cursor-paginated husqs in rev chron
  // optionally by username
  fastify.get(
    "/",
    {
      schema: {
        querystring: Type.Object({
          userId: Type.Optional(Type.Number()),
          cursor: Type.Optional(Type.Number()),
        }),
        tags: ["husqs"],
      },
    },
    async function (request, reply) {
      try {
        const { userId, cursor } = request.query;

        if (userId && cursor) {
          return await fastify.prisma.husq.findMany({
            take: 10,
            skip: 1,
            cursor: {
              id: cursor,
            },
            where: {
              authorId: userId,
              deleted: false,
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
        } else if (userId && !cursor) {
          return await fastify.prisma.husq.findMany({
            take: 10,
            where: {
              authorId: userId,
              deleted: false,
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
        } else if (!userId && cursor) {
          return await fastify.prisma.husq.findMany({
            take: 10,
            skip: 1,
            cursor: {
              id: cursor,
            },
            where: {
              deleted: false,
              reply: null,
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
  // get one husq
  fastify.get(
    "/:id",
    {
      schema: {
        params: Type.Object({
          id: Type.Number(),
        }),
        tags: ["husqs"],
      },
    },
    async function (request, reply) {
      try {
        const { id } = request.params;
        const husq = await fastify.prisma.husq.findUnique({
          where: {
            id: id,
          },
          include: {
            _count: {
              select: {
                likes: true,
                replies: true,
              },
            },
          },
        });
        return husq ?? reply.notFound();
      } catch (e) {
        request.log.error(e);
        return reply.internalServerError();
      }
    }
  );
  // make a husq
  fastify.post(
    "/",
    {
      schema: {
        body: Type.Object({
          text: Type.String(),
          replyId: Type.Optional(Type.Number()),
        }),
        tags: ["husqs"],
        summary: "create a husq",
      },
    },
    async function (request, reply) {
      if (request.body.text.length > 140) {
        return reply.badRequest("Text max length is 140 characters");
      }
      try {
        return await fastify.prisma.husq.create({
          data: {
            text: request.body.text,
            authorId: request.user.id,
            replyId: request.body.replyId,
          },
        });
      } catch (e) {
        request.log.error(e);
        return reply.internalServerError();
      }
    }
  );
  // delete a husq
  fastify.delete(
    "/:id",
    {
      schema: {
        params: Type.Object({
          id: Type.Number(),
        }),
        tags: ["husqs"],
      },
    },
    async function (request, reply) {
      const { id } = request.params;
      try {
        const husq = await fastify.prisma.husq.findUnique({
          where: { id: id },
        });
        if (!husq) return {};
        if (husq.authorId !== request.user.id) return reply.unauthorized();
        await fastify.prisma.husq.update({
          where: {
            id: id,
          },
          data: {
            deleted: true,
          },
        });
        return {};
      } catch (e) {
        request.log.error(e);
        return reply.internalServerError();
      }
    }
  );

  fastify.register(replies);
  fastify.register(likes);
};

export default husqs;
