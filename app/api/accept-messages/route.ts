import UserModel from "@/lib/models/user.schema";
import connectToDatabase from "@/lib/connectToDatabase";
import { getServerSession } from "next-auth";
import authOptions from "@/app/api/auth/[...nextauth]/options";

export async function GET() {
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  const user = (session as any)?.user as any;

  if (!session || !user) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const foundUser = await UserModel.findById(user._id);

    if (!foundUser)
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );

    return Response.json(
      { success: true, isAcceptingMessages: foundUser.isAcceptingMessages },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving message acceptance status: ", error);
    return Response.json(
      { success: false, message: "Error retrieving message acceptance status" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  await connectToDatabase();

  const session = await getServerSession(authOptions);
  const user = (session as any)?.user as any;

  if (!session || !user)
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );

  let acceptMessages;
  try {
    const body = await request.json();
    acceptMessages = body.acceptMessages;
  } catch {
    return Response.json(
      { success: false, message: "Invalid request body" },
      { status: 400 }
    );
  }

  if (typeof acceptMessages !== "boolean") {
    return Response.json(
      { success: false, message: "Invalid acceptMessages value" },
      { status: 400 }
    );
  }
  const userId = user._id;

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { isAcceptingMessages: acceptMessages },
      { new: true, projection: { isAcceptingMessages: 1 } }
    );

    if (!updatedUser)
      return Response.json(
        {
          success: false,
          message: "Unable to find user to update message acceptance status",
        },
        { status: 404 }
      );

    return Response.json(
      {
        success: true,
        message: "Message acceptance status updated successfully",
        isAcceptingMessages: updatedUser.isAcceptingMessages
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating message acceptance status: ", error);
    return Response.json(
      { success: false, message: "Error updating message acceptance status" },
      { status: 500 }
    );
  }
}