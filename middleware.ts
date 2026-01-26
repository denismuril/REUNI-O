import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(request) {
        // Permite acesso a rotas públicas
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const path = req.nextUrl.pathname;

                // Rotas públicas - sempre permite
                const publicRoutes = ['/login', '/api/auth', '/api/cron'];
                if (publicRoutes.some(route => path.startsWith(route))) {
                    return true;
                }

                // Página principal - permite acesso sem login (guest booking)
                if (path === '/') {
                    return true;
                }

                // Admin - requer autenticação
                if (path.startsWith('/admin')) {
                    return !!token;
                }

                // Outras rotas - permite
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
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
