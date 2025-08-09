import mongoose from 'mongoose';
import connectToDatabase from '@/lib/connectToDatabase';
import UserModel from '@/lib/models/user.schema';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function GET() {
     await connectToDatabase();

     const session = await auth.api.getSession({ headers: await headers() });
     const _user = session?.user as any;

     if (!session || !_user) return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });

     const userId = new mongoose.Types.ObjectId(_user._id);

     try {
          const messages = await UserModel.aggregate([
               // Stage 1: Match documents where _id is equal to the given userId
               { $match: { _id: userId } },

               // Stage 2: Deconstruct the 'messages' array field from the input documents to output a document for each element.
               { $unwind: '$messages' },

               // Stage 3: Sort the resulting documents by 'messages.createdAt' in descending order.
               { $sort: { 'messages.createdAt': -1 } },

               // Stage 4: Group the documents back into a single document per user, with an array of all 'messages', now sorted by 'createdAt'.
               { $group: { _id: '$_id', messages: { $push: '$messages' } } },
          ])
               .exec(); // Execute the aggregation pipeline and return the result

          if (!messages || messages.length === 0) return Response.json({ message: 'No message found', success: false }, { status: 404 });

          return Response.json({ messages: messages[0].messages }, { status: 200 });
     }

     catch (error: any) {
          console.error('An unexpected error occurred: ', error);
          return Response.json({ message: 'Internal server error', success: false }, { status: 500 });
     }
}