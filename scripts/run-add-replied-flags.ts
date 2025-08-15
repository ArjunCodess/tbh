import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { addRepliedFlags } from '@/lib/migrations/addRepliedFlags';

async function main() {
  const startedAt = Date.now();
  const res = await addRepliedFlags();
  // eslint-disable-next-line no-console
  console.log('Completed addRepliedFlags', { ...res, ms: Date.now() - startedAt });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});