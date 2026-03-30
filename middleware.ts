import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(request) {
        const path = request.nextUrl.pathname;
        const role = request.nextauth.token?.role;

        if (path.startsWith('/admin') && role !== 'ADMIN' && role !== 'SUPERADMIN') {
            return NextResponse.redirect(new URL('/', request.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const path = req.nextUrl.pathname;

                const publicRoutes = ['/login', '/api/auth', '/api/cron', '/api/send-email'];
                if (publicRoutes.some(route => path.startsWith(route))) {
                    return true;
                }

                if (path === '/') {
                    return true;
                }

                if (path.startsWith('/admin')) {
                    return !!token;
                }

                return true;
            },
        },
        pages: {
            signIn: '/login',
        },
    }
);

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
