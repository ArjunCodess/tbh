import { getServerSession } from "next-auth";
import authOptions from "@/app/api/auth/[...nextauth]/options";
import connectToDatabase from "@/lib/connectToDatabase";
import UserModel from "@/lib/models/user.schema";

export async function GET() {
  const session = await getServerSession(authOptions as any);
  if (!(session as any)?.user?._id) {
    return Response.json(
      { success: false, message: "not authenticated" },
      { status: 401 }
    );
  }
  await connectToDatabase();
  const user = await UserModel.findById((session as any).user._id, {
    username: 1,
    displayName: 1,
    profileColor: 1,
    textColor: 1,
  }).lean();
  return Response.json({ success: true, user });
}