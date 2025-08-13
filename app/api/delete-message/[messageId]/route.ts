import MessageModel from '@/lib/models/message.schema';
import connectToDatabase from '@/lib/connectToDatabase';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/options';
import { isValidObjectId } from 'mongoose';

export async function DELETE(request: Request, { params }: { params: Promise<{ messageId: string }> }) {
     const { messageId } = await params;

     if (!messageId || typeof messageId !== 'string' || !isValidObjectId(messageId)) {
          return Response.json({ success: false, message: 'Invalid or missing messageId' }, { status: 400 });
     }

     const session = await getServerSession(authOptions);
     const _user = (session as any)?.user as any;

     if (!session || !_user) return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });

     await connectToDatabase();

     try {
          const result = await MessageModel.deleteOne({ _id: messageId, userId: _user._id });
          if (result.deletedCount === 0) {
               return Response.json({ message: 'Message not found', success: false }, { status: 404 });
          }
          return Response.json({ message: 'Message deleted', success: true }, { status: 200 });     }

     catch (error: any) {
          console.error('An unexpected error occurred: ', error);
          return Response.json({ message: 'Internal server error', success: false }, { status: 500 });
     }
}