import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { bumpDailyPromptVersionOnce } from "../lib/migrations/bumpDailyPromptVersion";

async function main() {
  const report = await bumpDailyPromptVersionOnce();
  console.log(
    `bumpDailyPromptVersionOnce done -> matched=${report.matched}, modified=${report.modified}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("migration failed", err);
    process.exit(1);
  });