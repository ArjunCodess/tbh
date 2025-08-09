'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import {
     Form,
     FormField,
     FormItem,
     FormLabel,
     FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signInSchema } from '@/lib/schema/signInSchema';

export default function SignInFormPage() {
     const router = useRouter();

     const form = useForm<z.infer<typeof signInSchema>>({
          resolver: zodResolver(signInSchema),
          defaultValues: {
               identifier: '',
               password: '',
          },
     });

      const onSubmit = async (formData: z.infer<typeof signInSchema>) => {
           const result = await signIn('credentials', {
                redirect: false,
                identifier: formData.identifier,
                password: formData.password,
           });

           if (result?.error) {
                toast.error('Error', { description: result.error || 'Sign in failed' });
                return;
           }
           router.replace('/dashboard');
      };

     return (
          <div className="flex justify-center items-center min-h-screen sm:bg-neutral-900">
               <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg sm:shadow-md">
                    <div className="text-center">
                         <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-4">Welcome!</h1>
                         <p className="mb-4 text-sm md:text-base">Please sign in to pick up right where you left off.</p>
                    </div>

                    <Form {...form}>
                         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                              <FormField
                                   name="identifier"
                                   control={form.control}
                                   render={({ field }) => (
                                        <FormItem>
                                             <FormLabel>Email/Username</FormLabel>
                                             <Input {...field} />
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
                                             <Input type="password" {...field} />
                                             <FormMessage />
                                        </FormItem>
                                   )}
                              />

                              <Button className='w-full' type="submit">Sign In</Button>
                         </form>
                    </Form>
                    <div className="text-center mt-4">
                         <p>
                              Not a member yet?{' '}

                              <Link href="/sign-up" className="text-blue-600 hover:text-blue-800">
                                   Sign up
                              </Link>
                         </p>
                    </div>
               </div>
          </div>
     );
}