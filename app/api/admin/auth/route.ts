import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        const adminUsername = process.env.ADMIN_USERNAME || "admin";
        const adminPassword = process.env.ADMIN_PASSWORD || "reuni0@2026";

        if (username === adminUsername && password === adminPassword) {
            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { success: false, message: "Credenciais inválidas" },
            { status: 401 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Erro ao processar requisição" },
            { status: 500 }
        );
    }
}
