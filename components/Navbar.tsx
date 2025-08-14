"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, LogOut, Settings, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <header className="w-full border-b border-neutral-800 bg-neutral-950">
      <div className="container mx-auto px-3 sm:px-4 flex h-14 sm:h-16 items-center justify-between">
        <Link
          href="/"
          className="text-xl md:text-2xl font-bold flex items-center gap-2"
        >
          <span className="sr-only">TBH</span>
          <Image src="/tbh.png" alt="TBH" width={58} height={32} priority />
        </Link>

        {status === "loading" ? (
          <div className="h-8 w-8 rounded-full bg-neutral-200 animate-pulse"></div>
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full p-0 z-10"
              >
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage
                    src={(user as any)?.image || ""}
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback className="bg-neutral-100 text-neutral-800">
                    {user?.username?.charAt(0)?.toUpperCase() ||
                      user?.email?.charAt(0)?.toUpperCase() ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-medium">
                Logged in as{" "}
                <span className="font-bold">
                  @{user?.username ?? user?.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => signOut({ callbackUrl: "/sign-in" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            asChild
            variant="default"
            className="px-2 sm:px-4 text-sm h-8 sm:h-9 rounded-full"
          >
            <Link href="/sign-up">
              Create an account <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}