import { getServerSession } from 'next-auth';
import { authOptions } from './config';

/**
 * Obtém a sessão do usuário no servidor
 * Substitui o createClient() do Supabase para auth
 */
export async function getSession() {
    return await getServerSession(authOptions);
}

/**
 * Obtém o usuário atual ou null se não autenticado
 */
export async function getCurrentUser() {
    const session = await getSession();
    return session?.user ?? null;
}

/**
 * Verifica se o usuário atual é admin
 */
export async function isAdmin() {
    const session = await getSession();
    const role = (session?.user as any)?.role;
    return role === 'ADMIN' || role === 'SUPERADMIN';
}

/**
 * Verifica se o usuário atual é superadmin
 */
export async function isSuperAdmin() {
    const session = await getSession();
    const role = (session?.user as any)?.role;
    return role === 'SUPERADMIN';
}

export async function requireAdmin() {
    const session = await getSession();
    const role = session?.user?.role;

    if (!session?.user || (role !== 'ADMIN' && role !== 'SUPERADMIN')) {
        throw new Error('Acesso negado.');
    }

    return session.user;
}

export async function requireSuperAdmin() {
    const session = await getSession();
    const role = session?.user?.role;

    if (!session?.user || role !== 'SUPERADMIN') {
        throw new Error('Acesso negado. Somente superadmins podem executar esta acao.');
    }

    return session.user;
}

export { authOptions };
