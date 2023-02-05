import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { FastifyReply, FastifyRequest } from "fastify";
import users from "./users";
import husqs from "./husqs";
import timelines from "./timelines";

declare module "fastify" {
  export interface FastifyInstance {
    verifyTokenUserIsParamsMe: () => void;
  }
}
const secured: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.addHook("onRequest", fastify.auth([fastify.verifyJwt]));

  fastify.decorate(
    "verifyTokenUserIsParamsMe",
    async function (
      request: FastifyRequest<{
        Params: { me?: number };
      }>,
      reply: FastifyReply,
      done: (error?: Error | undefined) => void
    ) {
      if (!request.params.me) {
        return done(new Error("Not a valid ID"));
      }
      if (!request.user) {
        return done(new Error("No user"));
      }
      if (request.params.me !== request.user.id) {
        return done(new Error("Not allowed to modify other users"));
      }
    }
  );

  fastify.register(users, { prefix: "/v1/users" });
  fastify.register(husqs, { prefix: "/v1/husqs" });
  fastify.register(timelines, { prefix: "/v1/timelines" });
};

export default secured;
