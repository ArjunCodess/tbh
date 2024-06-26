import mongoose from 'mongoose';
import { User } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/options';
import connectToDatabase from '@/app/lib/connectToDatabase';
import UserModel from '@/app/lib/models/user.schema';

export async function GET(request: Request) {
     await connectToDatabase();

     const { searchParams } = new URL(request.url);
     const messageId = searchParams.get("messageId");

     const session = await getServerSession(authOptions);

     const _user: User = session?.user as User;

     if (!session || !_user) return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });

     const userId = new mongoose.Types.ObjectId(_user._id);

     try {
          const message = await UserModel.aggregate([
               // Stage 1: Match user by _id
               // { $match: { _id: userId } },

               // Stage 2: Filter messages array to find the desired message
               // { $project: { message: { $filter: { input: '$messages', cond: { $eq: ['$$this._id', messageId] } } } } }

               { $match: { _id: userId } },
               { $unwind: '$messages' },
               { $match: { "messages._id": new mongoose.Types.ObjectId(messageId!) } },
               { $project: { messages: 1 } }
          ]).exec();

          if (!message || message.length === 0) return Response.json({ message: 'No message found', success: false }, { status: 404 });

          return Response.json({ messages: message }, { status: 200 });
     }

     catch (error: any) {
          console.error('An unexpected error occurred: ', error);
          return Response.json({ message: 'Internal server error', success: false }, { status: 500 });
     }
}