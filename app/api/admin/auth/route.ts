import { NextResponse } from "next/server";
import { verifyAdminCredentials, countAdmins } from "@/app/actions/user-actions";

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        // Primeiro, verifica se existem admins no banco
        const adminCount = await countAdmins();

        if (adminCount > 0) {
            // Se existem admins no banco, autenticar via banco
            const result = await verifyAdminCredentials(username, password);

            if (result.success) {
                return NextResponse.json({
                    success: true,
                    user: result.user
                });
            }

            return NextResponse.json(
                { success: false, message: "Credenciais inválidas" },
                { status: 401 }
            );
        }

        // Fallback: Se não há admins no banco, usar env vars
        const adminUsername = process.env.ADMIN_USERNAME || "admin";
        const adminPassword = process.env.ADMIN_PASSWORD || "reuni0@2026";

        if (username === adminUsername && password === adminPassword) {
            return NextResponse.json({
                success: true,
                isEnvFallback: true // Indica que é login via env vars
            });
        }

        return NextResponse.json(
            { success: false, message: "Credenciais inválidas" },
            { status: 401 }
        );
    } catch (error) {
        console.error("Erro na autenticação admin:", error);
        return NextResponse.json(
            { success: false, message: "Erro ao processar requisição" },
            { status: 500 }
        );
    }
}
