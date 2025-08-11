import { getServerSession } from "next-auth";
import authOptions from "@/app/api/auth/[...nextauth]/options";
import connectToDatabase from "@/lib/connectToDatabase";
import UserModel from "@/lib/models/user.schema";
import UsernameRedirectModel from "@/lib/models/usernameRedirect.schema";
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
  const session = await getServerSession(authOptions as any);
  if (!(session as any)?.user?._id) {
    return Response.json(
      { success: false, message: "not authenticated" },
      { status: 401 }
    );
  }
  const userId = (session as any).user._id as string;

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
      const taken = await UserModel.findOne({ username: next })
        .collation({ locale: "en", strength: 2 })
        .lean();
      if (taken)
        return Response.json(
          { success: false, message: "username is already taken" },
          { status: 409 }
        );
      update.username = next;
      await UsernameRedirectModel.updateOne(
        { oldUsername: String(current.username).toLowerCase() },
        { $set: { newUsername: next, userId } },
        { upsert: true }
      );
    }
  }

  const saved = await UserModel.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true }
  );
  return Response.json({ success: true, user: saved });
}