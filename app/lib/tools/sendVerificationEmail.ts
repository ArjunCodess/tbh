import { resend } from "@/app/lib/resend";
import VerificationEmail from "@/app/emails/VerificationEmail";
import { apiResponse } from "@/types/apiResponse";

export async function sendVerificationEmail(email: string, username: string, verifyCode: string): Promise<apiResponse> {
     try {
          await resend.emails.send({
               from: 'ArjunCodess from TBH <onboarding@resend.dev>',
               to: email,
               subject: 'Verification Code | TBH',
               react: VerificationEmail({ username, otp: verifyCode }),
          })

          return { success: true, message: "Successfully sent verification email"}
     }

     catch(error:any) {
          console.error("Error :: sendVerificationEmail : " + error);
          return { success: false, message: "Failed to send verification email"}
     }
}