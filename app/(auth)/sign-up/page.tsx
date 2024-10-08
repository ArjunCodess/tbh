'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
     Form,
     FormField,
     FormItem,
     FormLabel,
     FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import axios, { AxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signUpSchema } from '@/app/lib/schema/signUpSchema';
import { apiResponse } from '@/types/apiResponse';
import { useDebounce } from "@uidotdev/usehooks";

export default function SignUpFormPage() {
     const [username, setUsername] = useState('');
     const [usernameMessage, setUsernameMessage] = useState('');
     const [isCheckingUsername, setIsCheckingUsername] = useState(false);
     const [isSubmitting, setIsSubmitting] = useState(false);

     const debouncedUsername = useDebounce(username, 500);

     const router = useRouter();
     const { toast } = useToast();

     const form = useForm<z.infer<typeof signUpSchema>>({
          resolver: zodResolver(signUpSchema),
          defaultValues: {
               username: '',
               email: '',
               password: '',
          },
     });

     useEffect(() => {
          const checkUsernameUnique = async () => {
               if (debouncedUsername) {
                    setIsCheckingUsername(true);
                    setUsernameMessage('');

                    try {
                         const response = await axios.get<apiResponse>(
                              `/api/check-username-unique?username=${debouncedUsername}`
                         );
                         setUsernameMessage(response.data.message);
                    }

                    catch (error) {
                         const axiosError = error as AxiosError<apiResponse>;
                         setUsernameMessage(
                              axiosError.response?.data.message ?? 'Error checking username'
                         );
                    }

                    finally {
                         setIsCheckingUsername(false);
                    }
               }
          };

          checkUsernameUnique();
     }, [debouncedUsername]);

     const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
          setIsSubmitting(true);
          try {
               const response = await axios.post<apiResponse>('/api/sign-up', data);

               toast({
                    title: 'Success',
                    description: response.data.message,
               });

               router.replace('/dashboard');

               setIsSubmitting(false);
          }

          catch (error: any) {
               const axiosError = error as AxiosError<apiResponse>;

               let errorMessage = axiosError.response?.data.message;
               ('There was a problem with your sign-up. Please try again.');

               toast({
                    title: 'Sign Up Failed',
                    description: errorMessage,
                    variant: 'destructive',
               });

               setIsSubmitting(false);
          }
     };

     return (
          <div className="flex justify-center items-center min-h-screen sm:bg-neutral-900">
               <div className="p-8 space-y-8 bg-white rounded-lg sm:shadow-md">
                    <div className="text-center">
                         <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-4">
                              Join TBH
                         </h1>
                         <p className="mb-4 text-sm md:text-base">Register to unlock your anonymous experience!</p>
                    </div>
                    
                    <Form {...form}>
                         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                              <FormField
                                   name="username"
                                   control={form.control}
                                   render={({ field }) => (
                                        <FormItem>
                                             <FormLabel>Username</FormLabel>
                                             <Input
                                                  {...field}
                                                  onChange={(e) => {
                                                       field.onChange(e);
                                                       setUsername(e.target.value);
                                                  }}
                                             />

                                             {isCheckingUsername && <Loader2 className="animate-spin mt-2" />}

                                             {!isCheckingUsername && usernameMessage &&
                                                  <p className={`text-sm ${usernameMessage === 'Username is available' ? 'text-green-500' : 'text-red-500'}`}>
                                                       {usernameMessage}
                                                  </p>
                                             }

                                             <FormMessage />
                                        </FormItem>
                                   )}
                              />

                              <FormField
                                   name="email"
                                   control={form.control}
                                   render={({ field }) => (
                                        <FormItem>
                                             <FormLabel>Email</FormLabel>
                                             <Input {...field} name="email" />
                                             <FormMessage />
                                        </FormItem>
                                   )}
                              />

                              <FormField
                                   name="password"
                                   control={form.control}
                                   render={({ field }) => (
                                        <FormItem>
                                             <FormLabel>Password</FormLabel>
                                             <Input type="password" {...field} name="password" />
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
                                   ) : 'Sign Up'}
                              </Button>
                         </form>
                    </Form>
                    <div className="text-center mt-4">
                         <p>
                              Already a member?{' '}
                              <Link href="/sign-in" className="text-blue-600 hover:text-blue-800">
                                   Sign in
                              </Link>
                         </p>
                    </div>
               </div>
          </div>
     );
}