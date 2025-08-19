import { getServerSession } from "next-auth";
import authOptions from "@/app/api/auth/[...nextauth]/options";
import connectToDatabase from "@/lib/connectToDatabase";
import UserModel from "@/lib/models/user.schema";
import { profileCustomisationsSchema } from "@/lib/schema/profileCustomisations";

const RESERVED = new Set([
  "dashboard",
  "u",
  "settings",
  "sign-in",
  "sign-up",
  "api",
]);

export async function PATCH(req: Request) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return Response.json(
      { success: false, message: "not authenticated" },
      { status: 401 }
    );
  }
  
  const userId = session.user._id;

  const body = await req.json();
  const parsed = profileCustomisationsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        message: "invalid payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const update: any = {};
  const data = parsed.data;
  if (data.displayName !== undefined)
    update.displayName = data.displayName.trim();
  if (data.profileColor !== undefined) update.profileColor = data.profileColor;
  if (data.textColor !== undefined) update.textColor = data.textColor;
  if (data.profileQuote !== undefined)
    update.profileQuote = data.profileQuote.trim();

  if (data.username !== undefined) {
    const next = data.username.toLowerCase();
    if (RESERVED.has(next)) {
      return Response.json(
        { success: false, message: "username is reserved" },
        { status: 400 }
      );
    }
    const current = await UserModel.findById(userId, { username: 1 }).lean();
    if (!current)
      return Response.json(
        { success: false, message: "user not found" },
        { status: 404 }
      );
    if (next !== String(current.username).toLowerCase()) {
      update.username = next;
      // The uniqueness will be enforced by a database constraint.
      // Any duplicate‐key error will be handled in the update below.
    }
  }
  try {
    const saved = await UserModel.findByIdAndUpdate(
      userId,
      { $set: update },
      {
        new: true,
        runValidators: true,
        projection: {
          username: 1,
          displayName: 1,
          profileColor: 1,
          textColor: 1,
        },
      }
    ).lean();
    if (!saved) {
      return Response.json(
        { success: false, message: "user not found" },
        { status: 404 }
      );
    }
    return Response.json({ success: true, user: saved });
  } catch (error: any) {
    if (error.code === 11000 && error.keyPattern?.username) {
      return Response.json(
        { success: false, message: "username is already taken" },
        { status: 409 }
      );
    }
    throw error;
  }
}