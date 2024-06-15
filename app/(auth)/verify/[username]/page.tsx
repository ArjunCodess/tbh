'use client';

import { verifySchema } from '@/app/lib/schema/verifySchema';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { apiResponse } from '@/types/apiResponse';
import { zodResolver } from '@hookform/resolvers/zod';
import axios, { AxiosError } from 'axios';
import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react'
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

export default function VerifyAccountPage() {
     const [isSubmitting, setIsSubmitting] = useState(false);

     const router = useRouter();
     const params = useParams();

     const { toast } = useToast();

     const form = useForm<z.infer<typeof verifySchema>>({
          resolver: zodResolver(verifySchema),
     });

     const onSubmit = async (data: z.infer<typeof verifySchema>) => {
          try {
               const response = await axios.post('/api/verify-code', { username: params.username, code: data.code });

               toast({
                    title: 'Success',
                    description: response.data.message,
               });

               router.replace('/sign-in');
          }

          catch (error: any) {
               const axiosError = error as AxiosError<apiResponse>;

               toast({
                    title: 'Verification Failed',
                    description: axiosError.response?.data.message,
                    variant: 'destructive',
               });
          }
     }

     return (
          <div className="flex justify-center items-center min-h-screen sm:bg-neutral-950">
               <div className="p-8 space-y-8 bg-white rounded-lg sm:shadow-md">
                    <div className="text-center">
                         <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-4">
                              Verify Your Account
                         </h1>
                         <p className="mb-4 text-sm md:text-base">Check your email for the verification code and enter it here.</p>
                    </div>
                    
                    <Form {...form}>
                         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                              <FormField
                                   name="code"
                                   control={form.control}
                                   render={({ field }) => (
                                        <FormItem>
                                             <FormLabel>Verification Code</FormLabel>
                                             <Input {...field} />
                                             <FormMessage />
                                        </FormItem>
                                   )}
                              />
                              <Button type="submit" className='w-full' disabled={isSubmitting}>
                                   {isSubmitting ? (
                                        <>
                                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                             Please wait
                                        </>
                                   ) : 'Verify'}
                              </Button>
                         </form>
                    </Form>
               </div>
          </div>
     )
}