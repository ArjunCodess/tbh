'use client'

import { Message } from '@/app/lib/models/message.schema';
import { acceptMessageSchema } from '@/app/lib/schema/acceptMessageSchema';
import MessageCard from '@/components/MessageCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { apiResponse } from '@/types/apiResponse';
import { zodResolver } from '@hookform/resolvers/zod';
import axios, { AxiosError } from 'axios';
import { Loader2, RefreshCcw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

export default function DashboardPage() {
     const [messages, setMessages] = useState<Message[]>([]);
     const [isLoading, setIsLoading] = useState(false);
     const [isSwitchLoading, setIsSwitchLoading] = useState(false);

     const { toast } = useToast();

     const handleDeleteMessage = (messageId: string) => setMessages(messages.filter((message) => message._id !== messageId));

     const { data: session } = useSession();

     const form = useForm({
          resolver: zodResolver(acceptMessageSchema),
     });

     const { register, watch, setValue } = form;

     const acceptMessages = watch('acceptMessages');

     const fetchAcceptMessages = useCallback(async () => {
          setIsSwitchLoading(true);

          try {
               const response = await axios.get<apiResponse>('/api/accept-messages');
               setValue('acceptMessages', response.data.isAcceptingMessages);
          }

          catch (error: any) {
               const axiosError = error as AxiosError<apiResponse>;

               toast({
                    title: 'Error',
                    description: axiosError.response?.data.message ?? 'Failed to fetch message settings',
                    variant: 'destructive',
               });
          }

          finally {
               setIsSwitchLoading(false);
          }
     }, [setValue, toast]);

     const fetchMessages = useCallback(async (refresh: boolean = false) => {
          setIsLoading(true);
          setIsSwitchLoading(false);

          try {
               const response = await axios.get<apiResponse>('/api/get-messages');
               setMessages(response.data.messages || []);

               if (refresh) toast({
                    title: 'Refreshed Messages',
                    description: 'Showing latest messages',
               });
          }

          catch (error) {
               const axiosError = error as AxiosError<apiResponse>;
               toast({
                    title: axiosError.response?.data.message ?? 'Failed to fetch messages',
                    variant: 'destructive',
               });
          }

          finally {
               setIsLoading(false);
               setIsSwitchLoading(false);
          }
     }, [setIsLoading, setMessages, toast]);

     useEffect(() => {
          if (!session || !session.user) return;

          fetchMessages();
          fetchAcceptMessages();
     }, [session, setValue, toast, fetchAcceptMessages, fetchMessages]);

     const handleSwitchChange = async () => {
          try {
               const response = await axios.post<apiResponse>('/api/accept-messages', { acceptMessages: !acceptMessages });
               setValue('acceptMessages', !acceptMessages);

               toast({
                    title: response.data.message,
                    variant: 'default',
               });
          }

          catch (error: any) {
               const axiosError = error as AxiosError<apiResponse>;

               toast({
                    title: 'Error',
                    description: axiosError.response?.data.message ?? 'Failed to update message settings',
                    variant: 'destructive',
               });
          }
     };

     const username = session?.user?.username;

     const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
     const profileUrl = `${origin}/profile/${username}`;

     const copyToClipboard = () => {
          navigator.clipboard.writeText(profileUrl);

          toast({
               title: 'URL Copied!',
               description: 'Profile URL has been copied to clipboard.',
          });
     };

     return (
          <section className="container px-4 my-14 md:my-20">
               <h1 className="text-4xl font-bold mb-4">User Dashboard</h1>

               <div className="mb-4">
                    <h2 className="text-base font-semibold mb-2 md:text-lg">Share your unique link with friends and start receiving messages instantly.</h2>
                    <div className="flex items-center flex-col md:flex-row">
                         <input
                              type="text"
                              value={profileUrl}
                              disabled
                              className="w-full p-2 mr-2 rounded-md"
                         />
                         <Button onClick={copyToClipboard} className='w-full my-4 md:w-auto'>Copy</Button>
                    </div>
               </div>

               <Separator />

               <div className='flex md:flex-row flex-col my-8 gap-y-6'>
                    <div className='mx-auto flex justify-center items-center'>
                         <Switch
                              {...register('acceptMessages')}
                              checked={acceptMessages}
                              onCheckedChange={handleSwitchChange}
                              disabled={isSwitchLoading}
                         />
                         <span className="ml-2">
                              Accept Messages: {acceptMessages ? 'On' : 'Off'}
                         </span>
                    </div>
                    <Button className="flex flex-row gap-x-4 ml-4 md:w-1/2" variant="outline" onClick={(e) => { e.preventDefault(); fetchMessages(true); }} disabled={isLoading}>
                         Reload Message Feed{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    </Button>
               </div>

               <Separator />

               <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {messages.length > 0 ? messages.map((message, index) => (
                         <MessageCard key={index} message={message} onMessageDelete={handleDeleteMessage} />
                    )) : <p className='mt-2'>No messages to display.</p>}
               </div>
          </section>
     );
}