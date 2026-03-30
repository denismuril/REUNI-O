import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

function isBcryptHash(value: string) {
    return /^\$2[aby]\$\d{2}\$/.test(value);
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Senha', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        return null;
                    }

                    const normalizedEmail = credentials.email.toLowerCase().trim();
                    const user = await prisma.user.findUnique({
                        where: { email: normalizedEmail },
                    });

                    if (!user || !user.password) {
                        return null;
                    }

                    let isValid = false;

                    if (isBcryptHash(user.password)) {
                        isValid = await bcrypt.compare(credentials.password, user.password);
                    } else if (credentials.password === user.password) {
                        isValid = true;

                        const hashedPassword = await bcrypt.hash(credentials.password, 12);
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { password: hashedPassword },
                        });
                    }

                    if (!isValid) {
                        return null;
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.fullName,
                        role: user.role,
                    };
                } catch (error) {
                    console.error('[Auth] authorize error:', error);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
    debug: process.env.NODE_ENV === 'development',
};
