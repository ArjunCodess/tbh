import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { addProfileQuote } from '../lib/migrations/addProfileQuote';

async function main() {
  console.log('Starting Profile Quote migration...');
  
  try {
    const result = await addProfileQuote();
    
    console.log('Migration completed successfully!');
    console.log(`Users processed: ${result.usersProcessed}`);
    console.log(`Users updated: ${result.usersUpdated}`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();