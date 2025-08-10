import connectToDatabase from "@/lib/connectToDatabase";
import UserModel from "@/lib/models/user.schema";
import { isUsernameTakenCI, findUserByEmailCI } from "@/lib/userIdentity";
import bcrypt from "bcryptjs";
import ThreadModel from "@/lib/models/thread.schema";
import mongoose from "mongoose";

export async function POST(request: Request) {
     await connectToDatabase();

     try {
          const { username, email, password } = await request.json();

          const usernameTaken = await isUsernameTakenCI(username);

          if (usernameTaken) {
               return Response.json({ success: false, message: "Username is already taken" }, { status: 400 })
          }

          const existingUserByEmail = await findUserByEmailCI(email);

           if (existingUserByEmail) {
               const hashedPassword = await bcrypt.hash(password, 10).toString();
               existingUserByEmail.password = hashedPassword;

               await existingUserByEmail.save();
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

                 try {
                   await ThreadModel.create({
                     userId: new mongoose.Types.ObjectId(newUser._id as string),
                     title: "ask me anything",
                     slug: "ama",
                   });
                 } catch {
                   // ignore duplicate creation errors
                 }
          }

          return Response.json({ success: true, message: "User registered successfully." }, { status: 200 });
     }

     catch (error: any) {
          console.log("Error :: api/sign-up/route.ts/POST : ", error);
          return Response.json({ success: false, message: "Error registering user" }, { status: 400 });
     }
}