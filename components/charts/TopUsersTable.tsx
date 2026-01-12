"use client";

import { User, Clock, Trophy } from "lucide-react";

interface TopUserData {
    email: string;
    name: string;
    totalBookings: number;
    totalHours: number;
}

interface TopUsersTableProps {
    data: TopUserData[];
}

export function TopUsersTable({ data }: TopUsersTableProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
                Nenhum dado disponível para o período selecionado
            </div>
        );
    }

    const getMedalColor = (index: number) => {
        switch (index) {
            case 0:
                return "text-yellow-500";
            case 1:
                return "text-gray-400";
            case 2:
                return "text-amber-600";
            default:
                return "text-muted-foreground";
        }
    };

    return (
        <div className="space-y-2">
            {data.map((user, index) => (
                <div
                    key={user.email}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                    {/* Posição */}
                    <div className={`w-8 h-8 flex items-center justify-center ${getMedalColor(index)}`}>
                        {index < 3 ? (
                            <Trophy className="h-5 w-5" />
                        ) : (
                            <span className="font-medium text-sm">{index + 1}º</span>
                        )}
                    </div>

                    {/* Avatar/Iniciais */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                    </div>

                    {/* Info do usuário */}
                    <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                        <p className="font-semibold text-primary">{user.totalBookings}</p>
                        <p className="text-xs text-muted-foreground">reservas</p>
                    </div>

                    <div className="text-right flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-sm">{user.totalHours.toFixed(1)}h</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
