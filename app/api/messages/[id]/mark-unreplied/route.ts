import connectToDatabase from '@/lib/connectToDatabase';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/options';
import MessageModel from '@/lib/models/message.schema';
import UserModel from '@/lib/models/user.schema';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return Response.json({ success: false, message: 'id is required' }, { status: 400 });

  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id ?? (session as any)?.user?._id;
  if (!session || !userId) {
    return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }  
  
  await connectToDatabase();

  const message = await MessageModel.findOne({ _id: id, userId });
  if (!message) {
    return Response.json({ success: false, message: 'Message not found' }, { status: 404 });
  }

  if (message.isReplied) {
    await MessageModel.updateOne({ _id: id, userId }, { $set: { isReplied: false } });

    await UserModel.updateOne(
      { _id: userId },
      { $inc: { replyCount: -1 } }
    );

    await UserModel.updateOne(
      { _id: userId, replyCount: { $lt: 0 } },
      { $set: { replyCount: 0 } }
    );
  }

  return Response.json({ success: true, message: 'Marked unreplied' }, { status: 200 });
}