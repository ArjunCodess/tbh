'use client'

import Link from "next/link"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useSession, signOut } from "next-auth/react";
import { ArrowRight } from "lucide-react"

export default function Navbar() {
    const { data: session } = useSession();
    const user = session?.user as any;

    return (
        <header>
            <nav className="flex h-16 items-center justify-between bg-neutral-950 px-4 md:px-6">
                <Link href="/" className="text-xl md:text-2xl font-bold text-white" prefetch={false}>
                    TBH
                </Link>

                {(session && user?.username && user?.email)
                    ? <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Avatar className="h-8 w-8 md:h-10 md:w-10">
                                    <AvatarFallback>{(user?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U')}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="font-medium">
                                Logged in as <span className="font-bold">@{user.username}</span>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Button className="w-full" variant="ghost" asChild>
                                <Link href="/dashboard">
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    Dashboard
                                </Link>
                            </Button>
                            <DropdownMenuSeparator />
                            <Button className="w-full" variant="ghost" asChild>
                                <Link href="/sign-in" onClick={() => signOut()}>
                                    <LogOutIcon className="mr-2 h-4 w-4" />
                                    Logout
                                </Link>
                            </Button>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    : (
                        <Button className="text-sm md:text-base bg-gradient-to-tr from-yellow-500 via-orange-500 to-violet-500 rounded-full h-10 px-4 py-2 text-white">
                            <Link href={"/sign-up"}>
                                Create an account <ArrowRight className="w-5 h-5 inline" />
                            </Link>
                        </Button>
                    )
                }
            </nav>
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

function UserIcon(props: any) {
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
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}