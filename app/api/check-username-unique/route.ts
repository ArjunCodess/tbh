import connectToDatabase from "@/app/lib/connectToDatabase";
import UserModel from "@/app/lib/models/user.schema";
import { z } from "zod";
import { usernameValidation } from "@/app/lib/schema/signUpSchema";

const UsernameQuerySchema = z.object({
     username: usernameValidation,
});

export async function GET(request: Request) {
     await connectToDatabase();

     try {
          const { searchParams } = new URL(request.url);
          const queryParam = { username: searchParams.get("username") };

          const result = UsernameQuerySchema.safeParse(queryParam);

          if (!result.success) {
               const usernameErrors = result.error.format().username?._errors || [];

               return Response.json({
                    success: false,
                    message: usernameErrors?.length > 0
                         ? usernameErrors.join(', ')
                         : 'Invalid query parameters'
               }, { status: 400 });
          }

          const { username } = result.data;

          const existingVerifiedUserByUsername = await UserModel.findOne({ username, isVerified: true });

          if (existingVerifiedUserByUsername) return Response.json({ success: false, message: 'Username is already taken' }, { status: 400 });

          return Response.json({ success: true, message: 'Username is available' });
     }

     catch (error: any) {
          console.error("Error checking username : ", error);
          return Response.json({ success: false, message: "Error checking username" }, { status: 400 });
     }
}