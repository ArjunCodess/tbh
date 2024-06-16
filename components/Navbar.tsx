'use client'

import Link from "next/link"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User } from 'next-auth';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
     const { data: session } = useSession();
     const user: User = session?.user;

     return (
          <header className="flex h-16 items-center justify-between bg-neutral-900 px-4 md:px-6">
               <Link href="/" className="text-lg font-bold text-white md:text-xl" prefetch={false}>
                    TBH
               </Link>

               {session &&
                    <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-full">
                                   <Avatar className="h-8 w-8 md:h-10 md:w-10">
                                        <AvatarFallback>{user.username.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}</AvatarFallback>
                                   </Avatar>
                              </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel className="font-medium">
                                   Logged in as <span className="font-bold">@{user.username}</span>
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <Button className="w-full bg-neutral-900" onClick={() => signOut()}>
                                   <LogOutIcon className="mr-2 h-4 w-4" />
                                   Logout
                              </Button>
                         </DropdownMenuContent>
                    </DropdownMenu>
               }
          </header>
     )
}

function LogOutIcon(props: any) {
     return (
          <svg
               {...props}
               xmlns="http://www.w3.org/2000/svg"
               width="24"
               height="24"
               viewBox="0 0 24 24"
               fill="none"
               stroke="currentColor"
               strokeWidth="2"
               strokeLinecap="round"
               strokeLinejoin="round"
          >
               <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
               <polyline points="16 17 21 12 16 7" />
               <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
     )
}