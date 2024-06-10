import connectToDatabase from "@/app/lib/connectToDatabase";
import UserModel from "@/app/lib/models/user.schema";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/app/lib/tools/sendVerificationEmail";

export async function POST(request: Request) {
     await connectToDatabase();

     try {
          const { username, email, password } = await request.json();

          const existingUserVerifiedByUsername = await UserModel.findOne({ username, isVerified: true });

          if (existingUserVerifiedByUsername) {
               return Response.json({ success: false, message: "Username is already taken" }, { status: 400 })
          }

          const existingUserByEmail = await UserModel.findOne({ email });

          const verifyCode = Math.floor(10000 + Math.random() * 900000).toString();

          if (existingUserByEmail) {
               if (existingUserByEmail.isVerified) {
                    return Response.json({ success: false, message: "User already exists with this email" }, { status: 400 });
               } else {
                    const hashedPassword = await bcrypt.hash(password, 10).toString();
                    existingUserByEmail.password = hashedPassword;
                    existingUserByEmail.verifyCode = verifyCode;
                    existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);

                    await existingUserByEmail.save();
               }
          } else {
               const hashedPassword = await bcrypt.hash(password, 10);

               const expiryDate = new Date();
               expiryDate.setHours(expiryDate.getHours() + 1);

               const newUser = new UserModel({
                    username,
                    email,
                    password: hashedPassword,
                    verifyCode,
                    verifyCodeExpiry: expiryDate,
                    isVerified: false,
                    isAcceptingMessages: true,
                    messages: [],
               });

               await newUser.save();
          }

          // send verification email
          const emailResponse = await sendVerificationEmail(email, username, verifyCode);

          if (!emailResponse.success) {
               return Response.json({ success: false, message: emailResponse.message }, { status: 400 });
          }

          return Response.json({ success: true, message: "User registered successfully. Please verify your email" }, { status: 200 });
     }

     catch (error: any) {
          console.log("Error :: api/sign-up/route.ts/POST : ", error);
          return Response.json({ success: false, message: "Error registering user" }, { status: 400 });
     }
}