'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CardHeader, CardContent, Card } from '@/components/ui/card';
import {
     Form,
     FormControl,
     FormField,
     FormItem,
     FormLabel,
     FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import * as z from 'zod';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { messageSchema } from '@/app/lib/schema/messageSchema';
import { apiResponse } from '@/types/apiResponse';

const specialChar = '||';

const parseStringMessages = (messageString: string): string[] => {
     return messageString.split(specialChar);
};

const initialMessageString = "What's your favorite movie?||Do you have any pets?||What's your dream job?";

export default function SendMessagePage() {
     const [suggestedMessages, setSuggestedMessages] = useState<string[]>(parseStringMessages(initialMessageString));

     const params = useParams<{ username: string }>();
     const username = params.username;

     const form = useForm<z.infer<typeof messageSchema>>({
          resolver: zodResolver(messageSchema),
     });

     const messageContent = form.watch('content');

     const handleMessageClick = (message: string) => {
          form.setValue('content', message);
     };

     const [isLoading, setIsLoading] = useState(false);

     const onSubmit = async (data: z.infer<typeof messageSchema>) => {
          setIsLoading(true);

          try {
               const response = await axios.post<apiResponse>('/api/send-message', {
                    ...data,
                    username,
               });

               toast({
                    title: response.data.message,
                    variant: 'default',
               });
               form.reset({ ...form.getValues(), content: '' });
          }

          catch (error: any) {
               const axiosError = error as AxiosError<apiResponse>;
               toast({
                    title: 'Error',
                    description: axiosError.response?.data.message ?? 'Failed to send message',
                    variant: 'destructive',
               });
          }

          finally {
               setIsLoading(false);
          }
     };

     const fetchSuggestedMessages = async () => {
          try {
               const response = await axios.get('/api/suggest-messages');
               const messagesArray = parseStringMessages(response.data.questions);
               setSuggestedMessages(messagesArray);
          }
          
          catch (error: any) {
               const axiosError = error as AxiosError<apiResponse>;

               toast({
                    title: 'Error',
                    description: axiosError.response?.data.message ?? 'Failed to fetch message settings',
                    variant: 'destructive',
               });
          }
     };

     return (
          <div className="container mx-auto my-8 p-6 bg-white rounded max-w-4xl">
               <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mt-2 mb-8">
                    Public Profile Link
               </h1>
               <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                         <FormField
                              control={form.control}
                              name="content"
                              render={({ field }) => (
                                   <FormItem>
                                        <FormLabel>Send Anonymous Message to @{username}</FormLabel>
                                        <FormControl>
                                             <Textarea
                                                  placeholder="Write your anonymous message here"
                                                  className="resize-none"
                                                  {...field}
                                             />
                                        </FormControl>
                                        <FormMessage />
                                   </FormItem>
                              )}
                         />
                         <div className="flex justify-center">
                              {isLoading ? <Button disabled className='w-full'><Loader2 className="mr-2 h-4 w-4 animate-spin" />Please wait</Button> : <Button type="submit" disabled={isLoading || !messageContent} className='w-full'>Send</Button>}
                         </div>
                    </form>
               </Form>

               <Separator className="mt-12" />

               <div className="space-y-4 my-8">
                    <div className="space-y-2 pt-4">
                         <p>Click on any message below to select it.</p>
                    </div>
                    <Card>
                         <CardHeader>
                              <h3 className="text-xl font-semibold">Messages</h3>
                         </CardHeader>
                         <CardContent className="flex flex-col space-y-4">
                              {suggestedMessages.map((message, index) => (
                                   <Button
                                        key={index}
                                        variant="outline"
                                        className="max-w-full overflow-hidden whitespace-normal py-8 md:py-0"
                                        onClick={() => handleMessageClick(message)}
                                   >
                                        {message}
                                   </Button>
                              ))}
                         </CardContent>
                    </Card>
               </div>
               <div className="space-y-2">
                    <Button
                         onClick={fetchSuggestedMessages}
                         className="mb-4 w-full"
                    >
                         Suggest Messages
                    </Button>
               </div>
               <Separator className="my-12" />
               <div className="text-center">
                    <div className="mb-4 text-lg">
                         Get Your TBH Message Board Now!
                         <Button className='w-full' variant='link'>
                              <Link href='/sign-up' className='text-lg'>Click Here To Create Your Account.</Link>
                         </Button>
                    </div>
               </div>
          </div>
     );
}