import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { backfillDailyPrompts } from "../lib/migrations/backfillDailyPrompts";

async function main() {
  const report = await backfillDailyPrompts();
  console.log(
    `backfillDailyPrompts done -> usersScanned=${report.usersScanned}, promptsSet=${report.promptsSet}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("migration failed", err);
    process.exit(1);
  });