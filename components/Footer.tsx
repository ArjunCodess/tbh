import { Github, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-14 bg-neutral-900 text-neutral-300 border-neutral-800 border-t">
      <div className="container mx-auto px-4 lg:px-6 flex flex-col lg:flex-row items-center justify-between">
        <div className="flex flex-col lg:max-w-xl">
          <Image src="/tbh.png" width={100} height={100} alt="TBH Logo" />
          <p className="pt-4 text-base md:text-lg font-extrabold">
            Ask bold. Answer real. Try TBH now.
          </p>
          <p className="pt-2 text-sm md:text-base">
            TBH is an anonymous Q&amp;A app where friends can send you
            questions, you can reply in public or private, make threads, and
            keep the fun going.
          </p>
        </div>
        <div className="w-full md:w-fit flex flex-col items-end mt-8 lg:mt-0">
          <nav className="mb-6">
            <ul className="flex flex-wrap gap-4 text-sm md:text-base font-semibold">
              <li>
                <Link
                  href="/signup"
                  className="hover:underline underline-offset-2"
                >
                  Sign Up
                </Link>
              </li>
              <li>
                <Link
                  href="/signin"
                  className="hover:underline underline-offset-2"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="hover:underline underline-offset-2"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className="hover:underline underline-offset-2"
                >
                  Settings
                </Link>
              </li>
            </ul>
          </nav>
          <p className="text-xs md:text-sm text-right">
            Built with ☕ and ❤️ by
            <br />
            <Link
              href="https://arjuncodess.is-a.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-50 font-semibold underline underline-offset-2"
            >
              @ArjunCodess
            </Link>
          </p>
          <div className="flex items-center gap-6 mt-4">
            <Link
              href="https://github.com/arjuncodess/tbh/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white"
              aria-label="GitHub, opens in new tab"
            >
              <Github className="h-6 w-6" aria-hidden="true" />
            </Link>
            <Link
              href="https://x.com/arjuncodess/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white"
              aria-label="Twitter, opens in new tab"
            >
              <Twitter className="h-6 w-6" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}