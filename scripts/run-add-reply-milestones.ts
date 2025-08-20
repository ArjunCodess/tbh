import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { addReplyMilestones } from '../lib/migrations/addReplyMilestones';

async function main() {
  console.log('Starting Reply Milestones migration...');
  
  try {
    const result = await addReplyMilestones();
    
    console.log('Migration completed successfully!');
    console.log(`Users processed: ${result.usersProcessed}`);
    console.log(`Users updated: ${result.usersUpdated}`);
    console.log(`Users with totalMessagesReceived updated: ${result.totalMessagesUpdated}`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();