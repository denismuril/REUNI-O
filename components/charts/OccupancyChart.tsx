"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

interface OccupancyData {
    roomName: string;
    branchName: string;
    totalBookings: number;
    totalHours: number;
    color: string;
}

interface OccupancyChartProps {
    data: OccupancyData[];
}

export function OccupancyChart({ data }: OccupancyChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                Nenhum dado disponível para o período selecionado
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                    type="category"
                    dataKey="roomName"
                    width={90}
                    tick={{ fontSize: 12 }}
                />
                <Tooltip
                    // @ts-expect-error - Recharts types are overly strict
                    formatter={(value: number, name: string) => {
                        if (name === "totalBookings") return [`${value} reservas`, "Reservas"];
                        if (name === "totalHours") return [`${value.toFixed(1)}h`, "Horas"];
                        return [value, name];
                    }}
                    labelFormatter={(label) => `Sala: ${label}`}
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                    }}
                />
                <Bar dataKey="totalBookings" name="totalBookings" radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
