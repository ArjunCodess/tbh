import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/connectToDatabase';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/options';
import ThreadModel from '@/lib/models/thread.schema';
import mongoose from 'mongoose';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function GET() {
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  const user = (session as any)?.user as any;
  if (!session || !user) {
    return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  const userId = user._id as string;

  const items = await ThreadModel.find({ userId }, null, { lean: true })
    .sort({ createdAt: -1 })
    .exec();

  // ensure default first
  const ama = items.find((t: any) => t.slug === 'ama');
  const rest = items.filter((t: any) => t.slug !== 'ama');
  const data = ama ? [ama, ...rest] : rest;

  return Response.json({ success: true, threads: data }, { status: 200 });
}

export async function POST(req: NextRequest) {
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  const user = (session as any)?.user as any;
  if (!session || !user) {
    return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json();
  const titleRaw = String(body?.title || '').trim();
  if (!titleRaw) {
    return Response.json({ success: false, message: 'title is required' }, { status: 400 });
  }

  const slug = slugify(titleRaw);
  if (!slug) {
    return Response.json({ success: false, message: 'invalid title' }, { status: 400 });
  }

  try {
    const exists = await ThreadModel.findOne({ userId: user._id, slug }).lean();
    if (exists) {
      return Response.json({ success: false, message: 'thread already exists' }, { status: 409 });
    }

    const created = await ThreadModel.create({ userId: user._id, title: titleRaw, slug });
    return Response.json({ success: true, thread: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'failed to create thread';
    return Response.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  const user = (session as any)?.user as any;
  if (!session || !user) {
    return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type') || '';
  let slug: string | null = null;
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    slug = typeof body?.slug === 'string' ? body.slug : null;
  }
  if (!slug) {
    const { searchParams } = new URL(req.url);
    slug = searchParams.get('slug');
  }

  if (!slug) {
    return Response.json({ success: false, message: 'slug is required' }, { status: 400 });
  }

  try {
    const res = await ThreadModel.deleteOne({ userId: new mongoose.Types.ObjectId(user._id), slug });
    if (res.deletedCount === 0) {
      return Response.json({ success: false, message: 'thread not found' }, { status: 404 });
    }
    return Response.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'failed to delete thread';
    return Response.json({ success: false, message }, { status: 500 });
  }
}