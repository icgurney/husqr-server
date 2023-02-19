import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import followers from "./followers";
import follows from "./follows";

const users: FastifyPluginAsyncTypebox = async (
  fastify,
  opts
): Promise<void> => {
  // get cursor-paginated users
  fastify.get(
    "/",
    {
      schema: {
        querystring: Type.Object({
          username: Type.Optional(Type.String()),
          cursor: Type.Optional(Type.Number()),
        }),
        tags: ["users"],
      },
    },
    async function (request, reply) {
      try {
        const { username, cursor } = request.query;
        if (username) {
          const user = await fastify.prisma.user.findUnique({
            where: { username },
          });
          return user ?? reply.notFound();
        }
        if (cursor) {
          return await fastify.prisma.user.findMany({
            take: 5,
            skip: 1,
            cursor: { id: cursor },
          });
        } else {
          return await fastify.prisma.user.findMany({ take: 5 });
        }
      } catch (e) {
        request.log.error(e);
        return reply.internalServerError();
      }
    }
  );

  fastify.get(
    "/:id",
    {
      schema: {
        params: Type.Object({
          id: Type.Number(),
        }),
        tags: ["users"],
      },
    },
    async function (request, reply) {
      const { id } = request.params;
      try {
        const user = await fastify.prisma.user.findUnique({ where: { id } });
        return user ?? reply.notFound();
      } catch (e) {
        request.log.error(e);
        return reply.internalServerError();
      }
    }
  );
  fastify.get(
    "/me",
    {
      schema: {
        tags: ["users"],
      },
    },
    async function (request, reply) {
      const { id } = request.user;
      try {
        const user = await fastify.prisma.user.findUnique({ where: { id } });
        return user ?? reply.notFound();
      } catch (e) {
        request.log.error(e);
        return reply.internalServerError();
      }
    }
  );

  fastify.patch(
    "/:me",
    {
      schema: {
        params: Type.Object({
          me: Type.Number(),
        }),
        body: Type.Object(
          {
            name: Type.Optional(Type.String()),
            about: Type.Optional(Type.String()),
          },
          { additionalProperties: false }
        ),
        tags: ["users"],
      },
      preHandler: fastify.auth([fastify.verifyTokenUserIsParamsMe]) as any,
    },
    async function (request, reply) {
      if (request.body.about && request.body.about.length > 1000)
        return reply.badRequest("about must be less than 1000 characters");
      const { me } = request.params;
      try {
        const user = await fastify.prisma.user.update({
          where: {
            id: me,
          },
          data: {
            ...request.body,
          },
        });
        return user;
      } catch (e) {
        request.log.error(e);
        return reply.internalServerError();
      }
    }
  );

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
        tags: ["users"],
        summary: "get a list of husqs a user has liked",
      },
    },
    async function (request, reply) {
      try {
        const { id } = request.params;
        const { cursor } = request.query;
        if (cursor) {
          const result = await fastify.prisma.husq.findMany({
            where: {
              deleted: false,
              likes: {
                some: {
                  id: id,
                },
              },
            },
            take: 10,
            skip: 1,
            cursor: {
              id: cursor,
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
          return result.map(
            (husq) => ({ ...husq, liked: true } ?? reply.notFound())
          );
        } else {
          const result = await fastify.prisma.husq.findMany({
            where: {
              deleted: false,
              likes: {
                some: {
                  id: id,
                },
              },
            },
            take: 10,
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
          return result.map(
            (husq) => ({ ...husq, liked: true } ?? reply.notFound())
          );
        }
      } catch (e) {
        request.log.error(e);
        return reply.internalServerError();
      }
    }
  );

  fastify.register(followers);
  fastify.register(follows);
};

export default users;
