import fp from "fastify-plugin";
import { fastifySwagger } from "@fastify/swagger";
import { fastifySwaggerUi } from "@fastify/swagger-ui";

export default fp(async (fastify) => {
  fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Husqr swagger",
        description:
          "Begin by registering a new user using /register then retrieve a JWT by logging in using /login. Click 'Authorize' on the right and paste in the JWT as the value.",
        version: "0.1.0",
      },
      tags: [{ name: "users" }, { name: "husqs" }, { name: "timelines" }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  fastify.register(fastifySwaggerUi, {
    uiHooks: {
      onRequest: fastify.auth([fastify.basicAuth]),
    },
  });
});
