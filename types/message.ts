export type MessageView = {
  _id: string;
  content: string;
  createdAt: string | Date;
  threadId?: string;
};