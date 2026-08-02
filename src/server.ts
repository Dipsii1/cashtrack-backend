import { prisma } from "./prisma/client.js";
import { env } from "./config/env.js";
import app from "./app.js";
import { recurringTransactionService } from "./services/recurring-transaction.service.js";

const server = app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
  console.log(`Environment: ${env.nodeEnv}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received, shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Database disconnected");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forceful shutdown");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

if (env.nodeEnv !== "test") {
  setInterval(async () => {
    try {
      const processed = await recurringTransactionService.processDue();
      if (processed > 0) console.log(`Processed ${processed} recurring transactions`);
    } catch (e) {
      console.error("Recurring transaction processor error:", e);
    }
  }, 60000);
}

export { server };