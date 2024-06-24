'use client'

import React from 'react';
import axios, { AxiosError } from 'axios';
import dayjs from 'dayjs';
import { X } from 'lucide-react';
import {
     Card,
     CardHeader,
     CardTitle
} from '@/components/ui/card';
import {
     AlertDialog,
     AlertDialogAction,
     AlertDialogCancel,
     AlertDialogContent,
     AlertDialogDescription,
     AlertDialogFooter,
     AlertDialogHeader,
     AlertDialogTitle,
     AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from './ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Message } from '@/app/lib/models/message.schema';
import { apiResponse } from '@/types/apiResponse';
import Link from 'next/link';

type MessageCardProps = {
     message: Message;
     onMessageDelete: (messageId: string) => void;
};

export default function MessageCard({ message, onMessageDelete }: MessageCardProps) {
     const { toast } = useToast();

     const handleDeleteConfirm = async () => {
          try {
               const response = await axios.delete<apiResponse>(
                    `/api/delete-message/${message._id}`
               );

               toast({
                    title: response.data.message,
               });

               onMessageDelete(message._id as string);
          }

          catch (error: any) {
               const axiosError = error as AxiosError<apiResponse>;

               toast({
                    title: 'Error',
                    description: axiosError.response?.data.message ?? 'Failed to delete message',
                    variant: 'destructive',
               });
          }
     };

     return (
          <Card className="card-bordered">
               <CardHeader>
                    <div className="flex justify-between items-center">
                         <CardTitle><Link href={`/dashboard/message/${message._id}`}>{message.content}</Link></CardTitle>
                         <AlertDialog>
                              <AlertDialogTrigger asChild>
                                   <Button variant='destructive'>
                                        <X className="w-5 h-5" />
                                   </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                   <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                             This action cannot be undone. This will permanently delete
                                             this message.
                                        </AlertDialogDescription>
                                   </AlertDialogHeader>
                                   <AlertDialogFooter>
                                        <AlertDialogCancel>
                                             Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction className="bg-red-700" onClick={handleDeleteConfirm}>
                                             Continue
                                        </AlertDialogAction>
                                   </AlertDialogFooter>
                              </AlertDialogContent>
                         </AlertDialog>
                    </div>
                    <div className="text-sm">
                         {dayjs(message.createdAt).format('MMM D, YYYY h:mm A')}
                    </div>
               </CardHeader>
          </Card>
     );
}