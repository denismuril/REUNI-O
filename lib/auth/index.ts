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

export { authOptions };
