import MessageModel from '@/lib/models/message.schema';
import connectToDatabase from '@/lib/connectToDatabase';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/options';

export async function DELETE(request: Request, { params }: { params: Promise<{ messageId: string }> }) {
     const { messageId } = await params;

     if (!messageId) {
          return Response.json({ success: false, message: 'messageId is required' }, { status: 400 });
     }

     const session = await getServerSession(authOptions);
     const _user = (session as any)?.user as any;

     if (!session || !_user) return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });

     await connectToDatabase();

     try {
          const deleted = await MessageModel.deleteOne({ _id: messageId, userId: _user._id });
          if (deleted.deletedCount === 0) return Response.json({ message: 'Message not found', success: false }, { status: 404 });
          return Response.json({ message: 'Message deleted', success: true }, { status: 200 });
     }

     catch (error: any) {
          console.error('An unexpected error occurred: ', error);
          return Response.json({ message: 'Internal server error', success: false }, { status: 500 });
     }
}