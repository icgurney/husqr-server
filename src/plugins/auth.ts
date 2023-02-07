import fp from "fastify-plugin";
import { fastifyAuth } from "@fastify/auth";
import { FastifyReply, FastifyRequest } from "fastify";
import { fastifyJwt } from "@fastify/jwt";
import { fastifyBasicAuth } from "@fastify/basic-auth";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { username: string; name: string; id: number }; // payload type is used for signing and verifying
    user: {
      username: string;
      name: string;
      id: number;
    }; // user type is return type of `request.user` object
  }
}

declare module "fastify" {
  export interface FastifyInstance {
    verifyWorkspace: () => void;
    verifyJwt: () => void;
  }
}

export default fp(async (fastify) => {
  fastify.register(fastifyAuth);
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET as string,
    sign: {
      expiresIn: "1h",
    },
  });
  fastify.register(fastifyBasicAuth, {
    validate: async function (username, password, request, reply) {
      if (
        username !== (process.env.DOCS_USERNAME as string) ||
        password !== (process.env.DOCS_PASSWORD as string)
      ) {
        return new Error("Unauthorized");
      }
    },
    authenticate: { realm: "documentation" },
  });

  fastify.decorate(
    "verifyJwt",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        request.log.info(request.headers);
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  );

  fastify.decorate(
    "verifyWorkspace",
    async function (
      request: FastifyRequest<{
        Body: { username?: string; password?: string; workspace?: string };
      }>,
      reply: FastifyRequest,
      done: (error?: Error | undefined) => void
    ) {
      if (!request.body || !request.body.workspace) {
        return done(new Error("Missing workspace in request body"));
      }
      if (request.body.workspace !== (process.env.WORKSPACE as string)) {
        return done(new Error("Invalid workspace"));
      }
    }
  );
});
