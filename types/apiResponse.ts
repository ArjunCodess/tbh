import { Message } from "@/lib/models/message.schema";

export interface apiResponse {
     success: boolean;
     message: string;
     isAcceptingMessages?: boolean;
     messages?: Array<Message>;
     questions?: string;
}