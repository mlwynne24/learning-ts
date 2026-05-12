import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/",
    {
      schema: { response: { 200: z.object({ status: z.literal("ok") }) } },
    },
    async () => ({ status: "ok" }) as const,
  );
};

export default healthRoutes;
