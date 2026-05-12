import { buildServer } from "./app/server.js";

const app = buildServer();
await app.listen({ port: 3000 }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
