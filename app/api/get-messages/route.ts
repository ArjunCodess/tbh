import mongoose from 'mongoose';
import connectToDatabase from '@/lib/connectToDatabase';
import UserModel from '@/lib/models/user.schema';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/options';
import ThreadModel from '@/lib/models/thread.schema';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
     await connectToDatabase();

     const session = await getServerSession(authOptions);
     const _user = (session as any)?.user as any;

     if (!session || !_user) return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });

     const userId = new mongoose.Types.ObjectId(_user._id);

     const { searchParams } = new URL(req.url);
     const threadSlug = searchParams.get('threadSlug');
     const threadIdParam = searchParams.get('threadId');

     let targetThreadId: mongoose.Types.ObjectId | null = null;
     if (threadIdParam && mongoose.isValidObjectId(threadIdParam)) {
       targetThreadId = new mongoose.Types.ObjectId(threadIdParam);
     } else {
       const slug = threadSlug || 'ama';
       const thread = await ThreadModel.findOne({ userId, slug }, { _id: 1 }).lean();
       if (thread) targetThreadId = new mongoose.Types.ObjectId(thread._id as any);
     }

     try {
          const pipeline: any[] = [
               { $match: { _id: userId } },
               { $unwind: '$messages' },
          ];

          if (targetThreadId) {
            pipeline.push({ $match: { 'messages.threadId': targetThreadId } });
          }

          pipeline.push(
            { $sort: { 'messages.createdAt': -1 } },
            { $group: { _id: '$_id', messages: { $push: '$messages' } } },
          );

          const messages = await UserModel.aggregate(pipeline).exec();

          if (!messages) {
            return Response.json(
              { message: 'No message found', success: false },
              { status: 404 }
            );
          }

          if (messages.length === 0) {
            return Response.json(
              { message: 'No messages yet', success: true, data: [] },
              { status: 200 }
            );
          }

          return Response.json({ messages: messages[0].messages }, { status: 200 });
     }

     catch (error: any) {
          console.error('An unexpected error occurred: ', error);
          return Response.json({ message: 'Internal server error', success: false }, { status: 500 });
     }
}