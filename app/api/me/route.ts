import { getServerSession } from "next-auth";
import authOptions from "@/app/api/auth/[...nextauth]/options";
import connectToDatabase from "@/lib/connectToDatabase";
import UserModel from "@/lib/models/user.schema";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !("_id" in session.user) || !session.user._id) {
    return Response.json(
      { success: false, message: "not authenticated" },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();

    const user = await UserModel.findById(session.user._id).lean();

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, user });
  } catch (error) {
    console.error("Error in /api/me GET handler while fetching user:", error);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}