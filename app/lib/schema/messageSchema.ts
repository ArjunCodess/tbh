import { z } from "zod";

export const messageSchema = z.object({
     content: z
          .string()
          .min(5, { message: "Text must be at least of 5 characters" })
          .max(100, { message: "Text must be no longer than 100 characters" }),
})