import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { HeadersSchema } from "./schema";
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
        headers: HeadersSchema,
        querystring: Type.Object({
          username: Type.Optional(Type.String()),
          cursor: Type.Optional(Type.Number()),
        }),
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
        headers: HeadersSchema,
        params: Type.Object({
          id: Type.Number(),
        }),
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
        headers: HeadersSchema,
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
        headers: HeadersSchema,
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
      },
      preHandler: fastify.auth([fastify.verifyTokenUserIsParamsMe]) as any,
    },
    async function (request, reply) {
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
      try {
        const { id } = request.params;
        const { cursor } = request.query;
        if (cursor) {
          const result = await fastify.prisma.user.findUnique({
            where: {
              id: id,
            },
            select: {
              likes: {
                take: 10,
                skip: 1,
                cursor: {
                  id: cursor,
                },
                where: {
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
              },
            },
          });
          return result ? result.likes : reply.notFound();
        } else {
          const result = await fastify.prisma.user.findUnique({
            where: {
              id: id,
            },
            select: {
              likes: {
                take: 10,
                where: {
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

  fastify.register(followers);
  fastify.register(follows);
};

export default users;
