'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { apiResponse } from '@/types/apiResponse';
import axios, { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { MessageData } from '@/app/lib/models/message.schema';
import { Message } from '@/app/lib/models/message.schema';

export default function MessagePage() {
     const [messages, setMessages] = useState<MessageData[] | Message[] | any>([]);

     const params = useParams<{ messageId: string }>();
     const messageId = params.messageId;

     const { toast } = useToast();

     const { data: session } = useSession();

     const fetchMessages = useCallback(async (refresh: boolean = false) => {
          try {
               const response = await axios.get<apiResponse>('/api/get-single-message?messageId=' + messageId);
               setMessages(response.data.messages || []);

               if (refresh) toast({
                    title: 'Refreshed Messages',
                    description: 'Showing latest messages',
               });
          }

          catch (error) {
               const axiosError = error as AxiosError<apiResponse>;
               toast({
                    title: 'Error',
                    description: axiosError.response?.data.message ?? 'Failed to fetch messages',
                    variant: 'destructive',
               });
          }
     }, [setMessages, toast, messageId]);

     useEffect(() => {
          if (!session || !session.user) return;

          fetchMessages();
     }, [session, toast, fetchMessages]);

     const message = messages[0];

     return (
          <div>
               {message?.messages.content}
          </div>
     )
}