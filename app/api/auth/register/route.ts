import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { email, password, fullName } = await request.json();

        // Validações básicas
        if (!email || !password || !fullName) {
            return NextResponse.json(
                { error: "Email, senha e nome são obrigatórios" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "A senha deve ter pelo menos 6 caracteres" },
                { status: 400 }
            );
        }

        // Valida domínio de email se configurado
        const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
        if (allowedDomain && !email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)) {
            return NextResponse.json(
                { error: `Apenas emails @${allowedDomain} são permitidos` },
                { status: 400 }
            );
        }

        // Verifica se usuário já existe
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Este email já está cadastrado" },
                { status: 400 }
            );
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Cria o usuário
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                fullName: fullName.trim(),
                role: "USER",
            },
        });

        return NextResponse.json({
            message: "Usuário criado com sucesso",
            userId: user.id,
        });
    } catch (error) {
        console.error("Erro ao registrar usuário:", error);
        return NextResponse.json(
            { error: "Erro interno ao criar conta" },
            { status: 500 }
        );
    }
}
