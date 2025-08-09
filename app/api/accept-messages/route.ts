import UserModel from '@/lib/models/user.schema';
import connectToDatabase from '@/lib/connectToDatabase';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function GET() {
     await connectToDatabase();

     const session = await auth.api.getSession({ headers: await headers() });
     const user = session?.user as any;

     if (!session || !user) {
          return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });
     }

     try {
          const foundUser = await UserModel.findById(user._id);

          if (!foundUser) return Response.json({ success: false, message: 'User not found' }, { status: 404 });

          return Response.json({ success: true, isAcceptingMessages: foundUser.isAcceptingMessages }, { status: 200 });
     }

     catch (error) {
          console.error('Error retrieving message acceptance status: ', error);
          return Response.json({ success: false, message: 'Error retrieving message acceptance status' }, { status: 500 });
     }
}

export async function POST(request: Request) {
     await connectToDatabase();

     const session = await auth.api.getSession({ headers: await headers() });
     const user = session?.user as any;

     if (!session || !session.user) return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });

      const userId = user._id;

     const { acceptMessages } = await request.json();

     try {
          const updatedUser = await UserModel.findByIdAndUpdate(userId, { isAcceptingMessages: acceptMessages }, { new: true });

          if (!updatedUser) return Response.json({ success: false, message: 'Unable to find user to update message acceptance status' }, { status: 404 });

          return Response.json({ success: true, message: 'Message acceptance status updated successfully', updatedUser }, { status: 200 });
     }

     catch (error: any) {
          console.error('Error updating message acceptance status: ', error);
          return Response.json({ success: false, message: 'Error updating message acceptance status' }, { status: 500 });
     }
}