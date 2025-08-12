import connectToDatabase from '@/lib/connectToDatabase';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/options';
import ThreadModel from '@/lib/models/thread.schema';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return Response.json({ success: false, message: 'id is required' }, { status: 400 });

  const session = await getServerSession(authOptions);
  const user = (session as any)?.user as any;
  if (!session || !user) return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });

  await connectToDatabase();

  const res = await ThreadModel.updateOne({ _id: id, userId: user._id }, { $set: { isReplied: true } });
  if (res.matchedCount === 0) return Response.json({ success: false, message: 'Thread not found' }, { status: 404 });
  return Response.json({ success: true, message: 'Thread archived' }, { status: 200 });
}


