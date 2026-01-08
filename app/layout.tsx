import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "REUNI-O | Sistema de Reserva de Salas",
    description:
        "Sistema corporativo de reserva de salas de reunião. Gerencie reservas, visualize disponibilidade e evite conflitos de agendamento.",
    keywords: ["reserva de salas", "meeting room", "agendamento", "reuniões"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body className={inter.className}>
                <TooltipProvider delayDuration={300}>
                    <div className="min-h-screen bg-background">
                        {children}
                    </div>
                </TooltipProvider>
            </body>
        </html>
    );
}
