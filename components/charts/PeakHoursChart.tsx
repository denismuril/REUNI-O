"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface PeakHourData {
    hour: number;
    bookings: number;
}

interface PeakHoursChartProps {
    data: PeakHourData[];
}

export function PeakHoursChart({ data }: PeakHoursChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                Nenhum dado disponível para o período selecionado
            </div>
        );
    }

    // Formatar dados para exibição
    const formattedData = data.map((item) => ({
        ...item,
        label: `${item.hour}:00`,
    }));

    // Encontrar o máximo para colorir as barras
    const maxBookings = Math.max(...data.map((d) => d.bookings));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formattedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                    formatter={(value: number) => [`${value} reservas`, "Reservas"]}
                    labelFormatter={(label) => `Horário: ${label}`}
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                    }}
                />
                <Bar
                    dataKey="bookings"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    // Colorir mais intenso nos picos
                    fillOpacity={0.8}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
