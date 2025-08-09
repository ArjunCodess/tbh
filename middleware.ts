import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export const config = {
    matcher: ['/dashboard/:path*', '/sign-in', '/sign-up', '/']
};

export async function middleware(request: NextRequest) {
    const url = request.nextUrl;
    const sessionCookie = getSessionCookie(request);

    if (
        sessionCookie &&
        (
            url.pathname.startsWith('/sign-in') ||
            url.pathname.startsWith('/sign-up')
        )
    ) return NextResponse.redirect(new URL('/dashboard', request.url));

    if (!sessionCookie && url.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    return NextResponse.next();
}