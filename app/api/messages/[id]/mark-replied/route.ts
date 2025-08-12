import connectToDatabase from '@/lib/connectToDatabase';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/options';
import MessageModel from '@/lib/models/message.schema';
import ThreadModel from '@/lib/models/thread.schema';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return Response.json({ success: false, message: 'id is required' }, { status: 400 });

  const session = await getServerSession(authOptions);
  const user = (session as any)?.user as any;
  if (!session || !user) return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });

  await connectToDatabase();

  // block for AMA thread messages
  const msg = await MessageModel.findOne({ _id: id, userId: user._id }, { threadId: 1 }).lean();
  if (!msg) return Response.json({ success: false, message: 'Message not found' }, { status: 404 });
  const thread = await ThreadModel.findById((msg as any).threadId, { slug: 1 }).lean();
  if (thread && String(thread.slug).toLowerCase() === 'ama') {
    return Response.json({ success: false, message: 'AMA messages cannot be marked as replied' }, { status: 400 });
  }

  const res = await MessageModel.updateOne({ _id: id, userId: user._id }, { $set: { isReplied: true } });
  if (res.matchedCount === 0) return Response.json({ success: false, message: 'Message not found' }, { status: 404 });
  return Response.json({ success: true, message: 'Marked replied' }, { status: 200 });
}