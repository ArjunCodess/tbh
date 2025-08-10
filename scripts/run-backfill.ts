import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { backfillDefaultThreadsAndAssign } from "../lib/migrations/backfillThreads";

async function main() {
  const result = await backfillDefaultThreadsAndAssign();
  console.log(
    `backfill complete -> usersProcessed=${result.usersProcessed}, threadsCreated=${result.threadsCreated}, messagesUpdated=${result.messagesUpdated}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("migration failed", err);
    process.exit(1);
  });