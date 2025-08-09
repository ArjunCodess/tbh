import connectToDatabase from "@/app/lib/connectToDatabase";
import UserModel from "@/app/lib/models/user.schema";
import bcrypt from "bcryptjs";
import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";

export async function POST(request: Request) {
     await connectToDatabase();

     try {
          const { username, email, password } = await request.json();

          const existingUserByUsername = await UserModel.findOne({ username });

          if (existingUserByUsername) {
               return Response.json({ success: false, message: "Username is already taken" }, { status: 400 })
          }

          const existingUserByEmail = await UserModel.findOne({ email });

          if (existingUserByEmail) {
               const hashedPassword = await bcrypt.hash(password, 10).toString();
               existingUserByEmail.password = hashedPassword;

                await existingUserByEmail.save();
                // try to create or sign in the auth user as well
                try {
                     await auth.api.signUpEmail({
                          headers: await headers(),
                          body: { email, password, name: username },
                     });
                } catch {
                     // if user already exists in better-auth, sign them in
                     await auth.api.signInEmail({
                          headers: await headers(),
                          body: { email, password },
                     });
                }
          } else {
               const hashedPassword = await bcrypt.hash(password, 10);

               const expiryDate = new Date();
               expiryDate.setHours(expiryDate.getHours() + 1);

               const newUser = new UserModel({
                    username,
                    email,
                    password: hashedPassword,
                    isAcceptingMessages: true,
                    messages: [],
               });

                await newUser.save();

                // create the auth user and session
                await auth.api.signUpEmail({
                     headers: await headers(),
                     body: { email, password, name: username },
                });
          }

          return Response.json({ success: true, message: "User registered successfully." }, { status: 200 });
     }

     catch (error: any) {
          console.log("Error :: api/sign-up/route.ts/POST : ", error);
          return Response.json({ success: false, message: "Error registering user" }, { status: 400 });
     }
}