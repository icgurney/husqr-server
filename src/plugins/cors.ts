import fp from "fastify-plugin";
import * as fastifyCors from "@fastify/cors";

export default fp(async (fastify) => {
  fastify.register(fastifyCors, { origin: true });
});
