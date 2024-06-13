import UserModel from '@/app/lib/models/user.schema';
import connectToDatabase from '@/app/lib/connectToDatabase';
import { Message } from '@/app/lib/models/message.schema';

export async function POST(request: Request) {
     await connectToDatabase();

     const { username, content } = await request.json();

     try {
          const user = await UserModel.findOne({ username }).exec();

          if (!user) return Response.json({ message: 'User not found', success: false }, { status: 404 });

          if (!user.isAcceptingMessages) return Response.json({ message: 'User is not accepting messages', success: false }, { status: 403 }); // 403 = Forbidden

          const newMessage = { content, createdAt: new Date() };

          user.messages.push(newMessage as Message);

          await user.save();

          return Response.json({ message: 'Message sent successfully', success: true }, { status: 201 });
     }
     
     catch (error: any) {
          console.error('Error adding message:', error);
          return Response.json({ message: 'Internal server error', success: false }, { status: 500 });
     }
}