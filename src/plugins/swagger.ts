import fp from "fastify-plugin";
import { fastifySwagger } from "@fastify/swagger";
import { fastifySwaggerUi } from "@fastify/swagger-ui";

export default fp(async (fastify) => {
  fastify.register(fastifySwagger);

  fastify.register(fastifySwaggerUi, {
    uiHooks: {
      onRequest: fastify.auth([fastify.basicAuth]),
    },
  });
});
