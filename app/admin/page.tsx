"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Building2, DoorOpen, Plus, Lock, LogOut, Trash2, Pencil, Save, X, Calendar, Clock, Search, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getBranches, getRoomsByBranch } from "@/app/actions/booking";
import {
    getBookingsForAdmin,
    getDeletionLogs,
    adminDeleteBooking,
    createBranch,
    updateBranch,
    createRoom,
    updateRoom,
    BookingForAdmin,
    DeletionLog,
} from "@/app/actions/admin-actions";

// Tipos locais
type Branch = {
    id: string;
    name: string;
    location: string;
    isActive: boolean;
};

type Room = {
    id: string;
    name: string;
    capacity: number;
    branchId: string;
    isActive: boolean;
};

// Schemas
const branchSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    location: z.string().min(2, "Local deve ter pelo menos 2 caracteres"),
});

const roomSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    branchId: z.string().min(1, "Selecione uma filial"),
    capacity: z.coerce.number().min(1, "Capacidade mínima é 1"),
});

type BranchFormData = z.infer<typeof branchSchema>;
type RoomFormData = z.infer<typeof roomSchema>;

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");

    // Dados
    const [branches, setBranches] = useState<Branch[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);

    // Estados de edição
    const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
    const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

    // Feedback
    const [branchSuccess, setBranchSuccess] = useState("");
    const [roomSuccess, setRoomSuccess] = useState("");
    const [branchError, setBranchError] = useState("");
    const [roomError, setRoomError] = useState("");

    // Reuniões Admin
    const [bookings, setBookings] = useState<BookingForAdmin[]>([]);
    const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
    const [deletionReason, setDeletionReason] = useState("");
    const [bookingError, setBookingError] = useState("");
    const [bookingSuccess, setBookingSuccess] = useState("");
    const [bookingSearch, setBookingSearch] = useState("");
    const [bookingDateFilter, setBookingDateFilter] = useState("");

    // Filtrar reuniões por pesquisa e data
    const filteredBookings = bookings.filter((b) => {
        const matchesSearch =
            b.title.toLowerCase().includes(bookingSearch.toLowerCase()) ||
            b.room_name.toLowerCase().includes(bookingSearch.toLowerCase()) ||
            (b.creator_name && b.creator_name.toLowerCase().includes(bookingSearch.toLowerCase())) ||
            (b.creator_email && b.creator_email.toLowerCase().includes(bookingSearch.toLowerCase()));

        const matchesDate = !bookingDateFilter ||
            new Date(b.start_time).toISOString().split('T')[0] === bookingDateFilter;

        return matchesSearch && matchesDate;
    });

    const branchForm = useForm<BranchFormData>({
        resolver: zodResolver(branchSchema),
        defaultValues: { name: "", location: "" },
    });

    const roomForm = useForm<RoomFormData>({
        resolver: zodResolver(roomSchema),
        defaultValues: { name: "", branchId: "", capacity: 10 },
    });

    // Carrega dados
    useEffect(() => {
        if (!isAuthenticated) return;
        loadData();
    }, [isAuthenticated]);

    async function loadData() {
        // Carregar branches via server action
        const branchesData = await getBranches();
        setBranches(branchesData as Branch[]);

        // Carregar todas as rooms (precisamos buscar de cada branch)
        const allRooms: Room[] = [];
        for (const branch of branchesData) {
            const roomsData = await getRoomsByBranch(branch.id);
            allRooms.push(...(roomsData as Room[]));
        }
        setRooms(allRooms);

        // Carrega reuniões
        const bookingsData = await getBookingsForAdmin();
        setBookings(bookingsData);
    }

    // Exclusão de reunião (admin)
    const handleDeleteBooking = async (bookingId: string) => {
        setBookingError("");
        setBookingSuccess("");

        const result = await adminDeleteBooking(bookingId, "admin", deletionReason || undefined);

        if (result.success) {
            setBookingSuccess("Reunião excluída com sucesso!");
            setDeletingBookingId(null);
            setDeletionReason("");
            loadData();
        } else {
            setBookingError(result.message || "Erro ao excluir reunião.");
        }
    };

    // Login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError("");

        try {
            const response = await fetch("/api/admin/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                setIsAuthenticated(true);
            } else {
                setLoginError(data.message || "Usuário ou senha incorretos");
            }
        } catch (error) {
            setLoginError("Erro ao conectar com o servidor");
        }
    };

    // Logout
    const handleLogout = () => {
        setIsAuthenticated(false);
        setUsername("");
        setPassword("");
    };

    // --- BRANCHES ---

    const startEditBranch = (branch: Branch) => {
        setEditingBranchId(branch.id);
        branchForm.setValue("name", branch.name);
        branchForm.setValue("location", branch.location);
        setBranchError("");
        setBranchSuccess("");
    };

    const cancelEditBranch = () => {
        setEditingBranchId(null);
        branchForm.reset();
        setBranchError("");
        setBranchSuccess("");
    };

    const onSubmitBranch = async (data: BranchFormData) => {
        setBranchError("");
        setBranchSuccess("");

        try {
            if (editingBranchId) {
                await updateBranch(editingBranchId, {
                    name: data.name,
                    location: data.location
                });
                setBranchSuccess(`Filial "${data.name}" atualizada com sucesso!`);
                setEditingBranchId(null);
            } else {
                await createBranch({
                    name: data.name,
                    location: data.location,
                });
                setBranchSuccess(`Filial "${data.name}" criada com sucesso!`);
            }

            branchForm.reset();
            loadData();
        } catch (error: any) {
            setBranchError(error.message || "Erro ao salvar filial");
        }
    };

    const deleteBranch = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir a filial "${name}"?`)) return;

        try {
            await updateBranch(id, { isActive: false });
            setBranchSuccess(`Filial "${name}" desativada com sucesso!`);
            loadData();
        } catch (error: any) {
            setBranchError("Erro ao excluir. Verifique se existem salas vinculadas.");
        }
    };

    // --- ROOMS ---

    const startEditRoom = (room: Room) => {
        setEditingRoomId(room.id);
        roomForm.setValue("name", room.name);
        roomForm.setValue("branchId", room.branchId);
        roomForm.setValue("capacity", room.capacity);
        setRoomError("");
        setRoomSuccess("");
    };

    const cancelEditRoom = () => {
        setEditingRoomId(null);
        roomForm.reset();
        setRoomError("");
        setRoomSuccess("");
    };

    const onSubmitRoom = async (data: RoomFormData) => {
        setRoomError("");
        setRoomSuccess("");

        try {
            if (editingRoomId) {
                await updateRoom(editingRoomId, {
                    name: data.name,
                    capacity: data.capacity,
                });
                setRoomSuccess(`Sala "${data.name}" atualizada com sucesso!`);
                setEditingRoomId(null);
            } else {
                await createRoom({
                    branchId: data.branchId,
                    name: data.name,
                    capacity: data.capacity,
                });
                setRoomSuccess(`Sala "${data.name}" criada com sucesso!`);
            }

            roomForm.reset();
            loadData();
        } catch (error: any) {
            setRoomError(error.message || "Erro ao salvar sala");
        }
    };

    const deleteRoom = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir a sala "${name}"?`)) return;

        try {
            await updateRoom(id, { isActive: false });
            setRoomSuccess(`Sala "${name}" desativada com sucesso!`);
            loadData();
        } catch (error: any) {
            setRoomError("Erro ao excluir sala.");
        }
    };


    // Tela de login
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl w-fit mb-4">
                            <Lock className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl">Painel Administrativo</CardTitle>
                        <CardDescription>
                            Entre com suas credenciais para acessar
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            {loginError && (
                                <div className="p-3 bg-red-100 border border-red-200 rounded-md text-red-600 text-sm">
                                    {loginError}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="username">Usuário</Label>
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Digite o usuário"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Digite a senha"
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                Entrar
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Painel admin
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                            <Lock className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">Painel Admin</h1>
                            <p className="text-xs text-muted-foreground">REUNI-O</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/admin/reports">
                            <Button variant="outline" className="gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Relatórios
                            </Button>
                        </Link>
                        <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <LogOut className="h-4 w-4" />
                            Sair
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* --- GERENCIAR FILIAIS --- */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                {editingBranchId ? "Editar Filial" : "Adicionar Filial"}
                            </CardTitle>
                            <CardDescription>
                                {editingBranchId ? "Atualize os dados da filial" : "Crie uma nova filial para o sistema"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={branchForm.handleSubmit(onSubmitBranch)} className="space-y-4">
                                {branchError && (
                                    <div className="p-3 bg-red-100 border border-red-200 rounded-md text-red-600 text-sm">
                                        {branchError}
                                    </div>
                                )}
                                {branchSuccess && (
                                    <div className="p-3 bg-green-100 border border-green-200 rounded-md text-green-600 text-sm">
                                        {branchSuccess}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="branchName">Nome da Filial</Label>
                                    <Input
                                        id="branchName"
                                        {...branchForm.register("name")}
                                        placeholder="Ex: Sede Lisboa"
                                    />
                                    {branchForm.formState.errors.name && (
                                        <p className="text-xs text-red-500">
                                            {branchForm.formState.errors.name.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="branchLocation">Localização</Label>
                                    <Input
                                        id="branchLocation"
                                        {...branchForm.register("location")}
                                        placeholder="Ex: Av. da Liberdade, 100"
                                    />
                                    {branchForm.formState.errors.location && (
                                        <p className="text-xs text-red-500">
                                            {branchForm.formState.errors.location.message}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" className="flex-1">
                                        {editingBranchId ? (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Salvar Alterações
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Adicionar Filial
                                            </>
                                        )}
                                    </Button>
                                    {editingBranchId && (
                                        <Button type="button" variant="outline" onClick={cancelEditBranch}>
                                            <X className="h-4 w-4 mr-2" />
                                            Cancelar
                                        </Button>
                                    )}
                                </div>
                            </form>

                            {/* Lista de filiais */}
                            <div className="mt-6">
                                <h4 className="font-medium mb-3">Filiais Cadastradas</h4>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {branches.map((branch) => (
                                        <div
                                            key={branch.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border ${editingBranchId === branch.id ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium">{branch.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {branch.location}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => startEditBranch(branch)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => deleteBranch(branch.id, branch.name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {branches.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            Nenhuma filial cadastrada
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* --- GERENCIAR SALAS --- */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DoorOpen className="h-5 w-5" />
                                {editingRoomId ? "Editar Sala" : "Adicionar Sala"}
                            </CardTitle>
                            <CardDescription>
                                {editingRoomId ? "Atualize os dados da sala" : "Crie uma nova sala de reunião"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={roomForm.handleSubmit(onSubmitRoom)} className="space-y-4">
                                {roomError && (
                                    <div className="p-3 bg-red-100 border border-red-200 rounded-md text-red-600 text-sm">
                                        {roomError}
                                    </div>
                                )}
                                {roomSuccess && (
                                    <div className="p-3 bg-green-100 border border-green-200 rounded-md text-green-600 text-sm">
                                        {roomSuccess}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>Filial</Label>
                                    <Select
                                        value={roomForm.watch("branchId")}
                                        onValueChange={(value) => roomForm.setValue("branchId", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a filial" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches.map((branch) => (
                                                <SelectItem key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {roomForm.formState.errors.branchId && (
                                        <p className="text-xs text-red-500">
                                            {roomForm.formState.errors.branchId.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="roomName">Nome da Sala</Label>
                                    <Input
                                        id="roomName"
                                        {...roomForm.register("name")}
                                        placeholder="Ex: Sala Tejo"
                                    />
                                    {roomForm.formState.errors.name && (
                                        <p className="text-xs text-red-500">
                                            {roomForm.formState.errors.name.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="roomCapacity">Capacidade</Label>
                                    <Input
                                        id="roomCapacity"
                                        type="number"
                                        {...roomForm.register("capacity")}
                                        placeholder="10"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" className="flex-1">
                                        {editingRoomId ? (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Salvar Alterações
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Adicionar Sala
                                            </>
                                        )}
                                    </Button>
                                    {editingRoomId && (
                                        <Button type="button" variant="outline" onClick={cancelEditRoom}>
                                            <X className="h-4 w-4 mr-2" />
                                            Cancelar
                                        </Button>
                                    )}
                                </div>
                            </form>

                            {/* Lista de salas */}
                            <div className="mt-6">
                                <h4 className="font-medium mb-3">Salas Cadastradas</h4>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {rooms.map((room) => (
                                        <div
                                            key={room.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border ${editingRoomId === room.id ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                        >
                                            <div>
                                                <p className="font-medium">{room.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {room.capacity} pessoas
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => startEditRoom(room)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => deleteRoom(room.id, room.name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {rooms.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            Nenhuma sala cadastrada
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- GERENCIAR REUNIÕES --- */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Gerenciar Reuniões
                        </CardTitle>
                        <CardDescription>
                            Visualize e exclua reuniões agendadas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {bookingError && (
                            <div className="p-3 bg-red-100 border border-red-200 rounded-md text-red-600 text-sm mb-4">
                                {bookingError}
                            </div>
                        )}
                        {bookingSuccess && (
                            <div className="p-3 bg-green-100 border border-green-200 rounded-md text-green-600 text-sm mb-4">
                                {bookingSuccess}
                            </div>
                        )}

                        {/* Filtros de Pesquisa */}
                        <div className="flex gap-4 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Pesquisar por título, sala, responsável..."
                                    value={bookingSearch}
                                    onChange={(e) => setBookingSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="w-48">
                                <Input
                                    type="date"
                                    value={bookingDateFilter}
                                    onChange={(e) => setBookingDateFilter(e.target.value)}
                                    placeholder="Filtrar por data"
                                />
                            </div>
                            {bookingDateFilter && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setBookingDateFilter("")}
                                    className="h-10"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {filteredBookings.map((booking) => (
                                <div
                                    key={booking.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${deletingBookingId === booking.id ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">{booking.title}</p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(booking.start_time).toLocaleDateString("pt-BR")} {new Date(booking.start_time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                            <span>{booking.room_name}</span>
                                            {booking.creator_name && <span>Por: {booking.creator_name}</span>}
                                        </div>
                                    </div>

                                    {deletingBookingId === booking.id ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                placeholder="Motivo (opcional)"
                                                value={deletionReason}
                                                onChange={(e) => setDeletionReason(e.target.value)}
                                                className="w-48 h-8 text-sm"
                                            />
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDeleteBooking(booking.id)}
                                            >
                                                Confirmar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setDeletingBookingId(null);
                                                    setDeletionReason("");
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => setDeletingBookingId(booking.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {bookings.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Nenhuma reunião futura agendada
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Link para página principal */}
                <div className="mt-8 text-center">
                    <Link href="/">
                        <Button variant="outline">Voltar para o Calendário</Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
