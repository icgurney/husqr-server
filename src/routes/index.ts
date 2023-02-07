import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import * as bcrypt from "bcryptjs";

const index: FastifyPluginAsyncTypebox = async (
  fastify,
  opts
): Promise<void> => {
  fastify.post(
    "/login",
    {
      schema: {
        body: Type.Object({
          username: Type.String(),
          password: Type.String(),
        }),
        summary: "use this to retrieve a jwt",
      },
    },
    async function (request, reply) {
      try {
        const userWithHashedPassword = await fastify.prisma.user.findUnique({
          where: { username: request.body.username },
          include: {
            hashedPassword: true,
          },
        });
        request.log.info(userWithHashedPassword);
        if (!userWithHashedPassword) {
          return reply.unauthorized();
        }
        if (userWithHashedPassword?.hashedPassword) {
          bcrypt.compare(
            request.body.password,
            userWithHashedPassword.hashedPassword.password,
            function (err, success) {
              if (err) {
                reply.send(err);
              } else if (!success) {
                return reply.unauthorized();
              } else {
                fastify.jwt.sign(
                  {
                    username: userWithHashedPassword.username,
                    name: userWithHashedPassword.name,
                    id: userWithHashedPassword.id,
                  },
                  async function (err, token) {
                    if (err) return reply.send(err);
                    request.log.info(
                      "User login: ",
                      userWithHashedPassword.username
                    );
                    reply.send({ token });
                  }
                );
              }
            }
          );
        }
      } catch (e) {
        request.log.error(e);
        return reply.internalServerError();
      }
      return reply;
    }
  );

  fastify.route({
    method: "POST",
    url: "/register",
    preHandler: fastify.auth([fastify.verifyWorkspace]) as any,
    schema: {
      body: Type.Object({
        username: Type.String(),
        name: Type.String(),
        password: Type.String(),
        workspace: Type.String(),
      }),
    },
    handler: async (request, reply) => {
      if (request.body.username.length < 3 || request.body.username.length > 20)
        return reply.badRequest("username must be between 3 and 20 characters");
      if (request.body.password.length < 3 || request.body.password.length > 20)
        return reply.badRequest("password must be between 3 and 20 characters");

      // hash password
      bcrypt.hash(request.body.password, 8, async function (err, hash) {
        if (err) {
          request.log.info(err);
          reply.send(err);
        } else {
          try {
            // store user and password
            const { user } = await fastify.prisma.hashedPassword.create({
              data: {
                password: hash,
                user: {
                  create: {
                    username: request.body.username,
                    name: request.body.name,
                  },
                },
              },
              include: {
                user: true,
              },
            });
            request.log.info("User created: ", user);
            reply.send({ ...user });
          } catch (e) {
            request.log.error(e);
            return reply.conflict();
          }
        }
      });
      return reply;
    },
  });
};

export default index;
