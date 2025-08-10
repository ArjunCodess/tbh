import connectToDatabase from '@/lib/connectToDatabase';
import MessageModel, { Message } from '@/lib/models/message.schema';
import { findUserByUsernameCI } from "@/lib/userIdentity";
import ThreadModel from '@/lib/models/thread.schema';
import mongoose from 'mongoose';

export async function POST(request: Request) {
     await connectToDatabase();

     const parsed = await request.json();
     const { username, content, threadSlug: threadSlugFromBody } = parsed as { username: string; content: string; threadSlug?: string };
     const url = new URL(request.url);
     const threadSlugFromQuery = url.searchParams.get('thread') || undefined;

     try {
          const user = await findUserByUsernameCI(username);

          if (!user) return Response.json({ message: 'User not found', success: false }, { status: 404 });

          if (!user.isAcceptingMessages) return Response.json({ message: 'User is not accepting messages', success: false }, { status: 403 }); // 403 = Forbidden

          const slug = threadSlugFromBody || threadSlugFromQuery || 'ama';
          const userId = new mongoose.Types.ObjectId(String(user._id));
          let thread = await ThreadModel.findOne({ userId, slug }, { _id: 1 }).lean();
          if (!thread && slug === 'ama') {
            const created = await ThreadModel.create({ userId, title: 'ask me anything', slug: 'ama' });
            thread = { _id: created._id } as any;
          }
          const threadId = thread?._id as mongoose.Types.ObjectId;
          const newMessage: Partial<Message> = {
            content,
            threadId,
            userId: userId,
          };

          await MessageModel.create(newMessage);

          return Response.json({ message: 'Message sent successfully', success: true }, { status: 201 });
     }
     
     catch (error: any) {
          console.error('Error adding message: ', error);
          return Response.json({ message: 'Internal server error', success: false }, { status: 500 });
     }
}