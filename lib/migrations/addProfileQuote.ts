import connectToDatabase from '../connectToDatabase';
import UserModel from '../models/user.schema';

// IMPORTANT: idempotent migration. safe to re-run.
export async function addProfileQuote(): Promise<{
  usersProcessed: number;
  usersUpdated: number;
}> {
  await connectToDatabase();

  let usersProcessed = 0;
  let usersUpdated = 0;

  // Get all users
  const users = await UserModel.find({});
  
  for (const user of users) {
    usersProcessed++;
    
    // Update user's profileQuote if it doesn't exist
    if (user.profileQuote === undefined) {
      await UserModel.updateOne(
        { _id: user._id },
        { $set: { profileQuote: '' } }
      );
      usersUpdated++;
    }
  }

  return {
    usersProcessed,
    usersUpdated,
  };
}