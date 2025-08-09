import UserModel from '@/app/lib/models/user.schema';
// mongoose import not needed here
import { User } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/options';
import connectToDatabase from '@/app/lib/connectToDatabase';

export async function DELETE(request: Request, { params }: { params: Promise<{ messageId: string }> }) {
     const { messageId } = await params;

     await connectToDatabase();

     const session = await getServerSession(authOptions);

     const _user: User = session?.user as User;

     if (!session || !_user) return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });

     // NOTE: userId not needed directly here; using _user._id in the query below

     try {
          // Update the user document by removing a message with the specified messageId
          const updateResult = await UserModel.updateOne(
               { _id: _user._id }, // Filter: Find the user document by user ID
               { $pull: { messages: { _id: messageId } } } // Update: Pull (remove) the message with the specified messageId from the messages array
          );

          if (updateResult.modifiedCount === 0) return Response.json({ message: 'Message not found', success: false }, { status: 404 });

          return Response.json({ message: 'Message deleted', success: true }, { status: 200 });
     }

     catch (error: any) {
          console.error('An unexpected error occurred: ', error);
          return Response.json({ message: 'Internal server error', success: false }, { status: 500 });
     }
}