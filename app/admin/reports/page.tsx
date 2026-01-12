"use client";

import React, { useState, useEffect } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, ArrowLeft, Download, Loader2 } from "lucide-react";
import Link from "next/link";

import {
    getOccupancyByRoom,
    getPeakHours,
    getTopUsers,
    getMonthlyStats,
    OccupancyStats,
    PeakHourStats,
    TopUserStats,
    MonthlyStats,
} from "@/app/actions/report-actions";

import { OccupancyChart } from "@/components/charts/OccupancyChart";
import { PeakHoursChart } from "@/components/charts/PeakHoursChart";
import { TopUsersTable } from "@/components/charts/TopUsersTable";

export default function ReportsPage() {
    const [period, setPeriod] = useState("last30"); // last30, thisMonth, lastMonth
    const [loading, setLoading] = useState(true);

    // Estados dos dados
    const [occupancyData, setOccupancyData] = useState<OccupancyStats[]>([]);
    const [peakHoursData, setPeakHoursData] = useState<PeakHourStats[]>([]);
    const [topUsersData, setTopUsersData] = useState<TopUserStats[]>([]);
    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);

    // Carregar dados
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Calcular datas baseado no período
                const today = new Date();
                let startDate = subDays(today, 30);
                let endDate = today;

                if (period === "thisMonth") {
                    startDate = startOfMonth(today);
                    endDate = endOfMonth(today);
                } else if (period === "lastMonth") {
                    const lastMonth = subMonths(today, 1);
                    startDate = startOfMonth(lastMonth);
                    endDate = endOfMonth(lastMonth);
                }

                // Disparar requisições em paralelo
                const [occupancy, peakHours, topUsers, stats] = await Promise.all([
                    getOccupancyByRoom(startDate, endDate),
                    getPeakHours(startDate, endDate),
                    getTopUsers(10, startDate, endDate),
                    getMonthlyStats(
                        period === "lastMonth" ? subMonths(today, 1).getFullYear() : today.getFullYear(),
                        period === "lastMonth" ? subMonths(today, 1).getMonth() + 1 : today.getMonth() + 1
                    )
                ]);

                if (occupancy.data) setOccupancyData(occupancy.data);
                if (peakHours.data) setPeakHoursData(peakHours.data);
                if (topUsers.data) setTopUsersData(topUsers.data);
                if (stats.data) setMonthlyStats(stats.data); // Fixed property access

            } catch (error) {
                console.error("Erro ao carregar relatórios:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [period]);

    // Função para exportar (simulação)
    const handleExport = () => {
        alert("Exportação será implementada na próxima versão.");
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <Link href="/admin" className="hover:text-primary transition-colors flex items-center gap-1">
                            <ArrowLeft className="h-4 w-4" />
                            Voltar para Admin
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Relatórios e Analytics</h1>
                    <p className="text-muted-foreground">
                        Visualize o uso das salas e comportamento dos usuários.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="last30">Últimos 30 dias</SelectItem>
                            <SelectItem value="thisMonth">Este Mês</SelectItem>
                            <SelectItem value="lastMonth">Mês Passado</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Cards de Resumo */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total de Reservas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{monthlyStats?.totalBookings || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    no período selecionado
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Horas Utilizadas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{monthlyStats?.totalHours || 0}h</div>
                                <p className="text-xs text-muted-foreground">
                                    tempo total de ocupação
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Sala Mais Usada</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold truncate text-sm" title={monthlyStats?.mostUsedRoom}>
                                    {monthlyStats?.mostUsedRoom || "N/A"}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    maior volume de reservas
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Dia de Pico</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-sm truncate">
                                    {monthlyStats?.peakDay || "N/A"}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    maior concentração de reuniões
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Gráficos Principais */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        {/* Ocupação por Sala (4 colunas) */}
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Ocupação por Sala</CardTitle>
                                <CardDescription>
                                    Número total de reservas confirmadas por sala.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <OccupancyChart data={occupancyData} />
                            </CardContent>
                        </Card>

                        {/* Top Usuários (3 colunas) */}
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Top Usuários</CardTitle>
                                <CardDescription>
                                    Usuários que mais agendaram reuniões.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TopUsersTable data={topUsersData} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Horários de Pico */}
                    <div className="grid gap-4 md:grid-cols-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Distribuição por Horário</CardTitle>
                                <CardDescription>
                                    Volume de reservas por hora do dia (08h às 18h).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <PeakHoursChart data={peakHoursData} />
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
