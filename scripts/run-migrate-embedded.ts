import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { migrateEmbeddedMessages } from "../lib/migrations/migrateEmbeddedMessages";

async function main() {
  const report = await migrateEmbeddedMessages({ clearEmbeddedAfter: true });
  console.log(
    `migrateEmbeddedMessages done -> usersScanned=${report.usersScanned}, defaultThreadsCreated=${report.defaultThreadsCreated}, embeddedMessagesFound=${report.embeddedMessagesFound}, messagesInsertedOrUpserted=${report.messagesInsertedOrUpserted}, usersClearedEmbeddedMessages=${report.usersClearedEmbeddedMessages}, userIndexDropped=${report.userIndexDropped}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("migration failed", err);
    process.exit(1);
  });