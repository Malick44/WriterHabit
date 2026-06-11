import { buildServer } from "./server";
import { loadConfig } from "./runtime/config";

const config = loadConfig();
const server = await buildServer({ config });

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  server.log.info({ signal }, "Shutting down WriterHabit API");
  await server.close();
};

process.once("SIGINT", (signal) => {
  void shutdown(signal).finally(() => {
    process.exit(0);
  });
});

process.once("SIGTERM", (signal) => {
  void shutdown(signal).finally(() => {
    process.exit(0);
  });
});

try {
  await server.listen({
    host: config.host,
    port: config.port,
  });
} catch (error) {
  server.log.fatal({ err: error }, "Failed to start WriterHabit API");
  process.exit(1);
}
