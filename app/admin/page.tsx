"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { BarChart3, Building2, Calendar, DoorOpen, LogOut, Search, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBranches, getRoomsByBranch } from "@/app/actions/booking";
import { adminDeleteBooking, createBranch, createRoom, getBookingsForAdmin, updateBranch, updateRoom } from "@/app/actions/admin-actions";
import { createAdminUser, deleteAdminUser, getAdminUsers } from "@/app/actions/user-actions";

type Branch = { id: string; name: string; location: string; isActive: boolean };
type Room = { id: string; name: string; capacity: number; branchId: string; isActive: boolean };
type Booking = { id: string; title: string; start_time: string; end_time: string; room_name: string; creator_name: string | null; creator_email: string | null; status: string };
type AdminUser = { id: string; email: string; fullName: string; role: "ADMIN" | "SUPERADMIN"; createdAt: string };

export default function AdminPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [branchName, setBranchName] = useState("");
    const [branchLocation, setBranchLocation] = useState("");
    const [roomName, setRoomName] = useState("");
    const [roomBranchId, setRoomBranchId] = useState("");
    const [roomCapacity, setRoomCapacity] = useState("10");
    const [userEmail, setUserEmail] = useState("");
    const [userFullName, setUserFullName] = useState("");
    const [userPassword, setUserPassword] = useState("");
    const [userRole, setUserRole] = useState<"ADMIN" | "SUPERADMIN">("ADMIN");
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deletionReason, setDeletionReason] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const branchData = await getBranches();
            const roomData = await Promise.all(branchData.map((branch) => getRoomsByBranch(branch.id)));
            const [bookingData, adminData] = await Promise.all([getBookingsForAdmin(), getAdminUsers()]);
            setBranches(branchData as Branch[]);
            setRooms(roomData.flat() as Room[]);
            setBookings(bookingData as Booking[]);
            setAdmins(adminData as AdminUser[]);
        } catch (err) {
            console.error(err);
            setError("Nao foi possivel carregar o painel.");
        }
    }

    const filteredBookings = bookings.filter((booking) => {
        const matchText = [booking.title, booking.room_name, booking.creator_name || "", booking.creator_email || ""]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchDate = !dateFilter || new Date(booking.start_time).toISOString().split("T")[0] === dateFilter;
        return matchText && matchDate;
    });

    const flash = (message: string, isError = false) => {
        if (isError) {
            setError(message);
            setSuccess("");
        } else {
            setSuccess(message);
            setError("");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <header className="border-b bg-white/80 backdrop-blur">
                <div className="container mx-auto flex items-center justify-between px-4 py-3">
                    <div>
                        <h1 className="text-lg font-bold">Painel Admin</h1>
                        <p className="text-xs text-muted-foreground">REUNI-O</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin/reports"><Button variant="outline"><BarChart3 className="mr-2 h-4 w-4" />Relatorios</Button></Link>
                        <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/login" })}><LogOut className="mr-2 h-4 w-4" />Sair</Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto space-y-8 px-4 py-8">
                {(error || success) && <div className={`rounded-md border p-3 text-sm ${error ? "border-red-200 bg-red-100 text-red-700" : "border-green-200 bg-green-100 text-green-700"}`}>{error || success}</div>}

                <div className="grid gap-8 lg:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Filiais</CardTitle><CardDescription>Criar, editar e desativar filiais.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label>Nome</Label><Input value={branchName} onChange={(e) => setBranchName(e.target.value)} /></div>
                            <div className="space-y-2"><Label>Localizacao</Label><Input value={branchLocation} onChange={(e) => setBranchLocation(e.target.value)} /></div>
                            <Button onClick={async () => {
                                try {
                                    await createBranch({ name: branchName, location: branchLocation });
                                    setBranchName(""); setBranchLocation(""); flash("Filial criada com sucesso."); await loadData();
                                } catch { flash("Nao foi possivel criar a filial.", true); }
                            }}>Criar Filial</Button>
                            <div className="space-y-2">
                                {branches.map((branch) => <div key={branch.id} className="flex items-center justify-between rounded border bg-white p-3"><div><p className="font-medium">{branch.name}</p><p className="text-xs text-muted-foreground">{branch.location}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={async () => {
                                    const name = prompt("Nome da filial", branch.name); if (!name) return;
                                    const location = prompt("Localizacao", branch.location); if (!location) return;
                                    try { await updateBranch(branch.id, { name, location }); flash("Filial atualizada."); await loadData(); } catch { flash("Nao foi possivel atualizar a filial.", true); }
                                }}>Editar</Button><Button variant="ghost" size="icon" className="text-red-600" onClick={async () => {
                                    if (!confirm(`Desativar ${branch.name}?`)) return;
                                    try { await updateBranch(branch.id, { isActive: false }); flash("Filial desativada."); await loadData(); } catch { flash("Nao foi possivel desativar a filial.", true); }
                                }}><Trash2 className="h-4 w-4" /></Button></div></div>)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><DoorOpen className="h-5 w-5" />Salas</CardTitle><CardDescription>Criar, editar e desativar salas.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label>Nome</Label><Input value={roomName} onChange={(e) => setRoomName(e.target.value)} /></div>
                            <div className="space-y-2"><Label>Filial</Label><Select value={roomBranchId} onValueChange={setRoomBranchId}><SelectTrigger><SelectValue placeholder="Selecione a filial" /></SelectTrigger><SelectContent>{branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-2"><Label>Capacidade</Label><Input type="number" min={1} value={roomCapacity} onChange={(e) => setRoomCapacity(e.target.value)} /></div>
                            <Button onClick={async () => {
                                try {
                                    await createRoom({ name: roomName, branchId: roomBranchId, capacity: Number(roomCapacity) });
                                    setRoomName(""); setRoomBranchId(""); setRoomCapacity("10"); flash("Sala criada com sucesso."); await loadData();
                                } catch { flash("Nao foi possivel criar a sala.", true); }
                            }}>Criar Sala</Button>
                            <div className="space-y-2">
                                {rooms.map((room) => <div key={room.id} className="flex items-center justify-between rounded border bg-white p-3"><div><p className="font-medium">{room.name}</p><p className="text-xs text-muted-foreground">{branches.find((branch) => branch.id === room.branchId)?.name || "Filial"} • {room.capacity} lugares</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={async () => {
                                    const name = prompt("Nome da sala", room.name); if (!name) return;
                                    const capacity = prompt("Capacidade", String(room.capacity)); if (!capacity) return;
                                    try { await updateRoom(room.id, { name, capacity: Number(capacity) }); flash("Sala atualizada."); await loadData(); } catch { flash("Nao foi possivel atualizar a sala.", true); }
                                }}>Editar</Button><Button variant="ghost" size="icon" className="text-red-600" onClick={async () => {
                                    if (!confirm(`Desativar ${room.name}?`)) return;
                                    try { await updateRoom(room.id, { isActive: false }); flash("Sala desativada."); await loadData(); } catch { flash("Nao foi possivel desativar a sala.", true); }
                                }}><Trash2 className="h-4 w-4" /></Button></div></div>)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Reservas</CardTitle><CardDescription>Pesquisar e cancelar reservas sem apagar historico.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="md:w-48" /></div>
                        <div className="space-y-2">
                            {filteredBookings.map((booking) => <div key={booking.id} className="rounded border bg-white p-3"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2"><p className="font-medium">{booking.title}</p><span className={`rounded-full px-2 py-0.5 text-xs ${booking.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{booking.status === "cancelled" ? "Cancelada" : "Confirmada"}</span></div><p className="text-xs text-muted-foreground">{new Date(booking.start_time).toLocaleString("pt-BR")} • {booking.room_name}{booking.creator_name ? ` • ${booking.creator_name}` : ""}</p></div>{booking.status === "cancelled" ? <Button variant="outline" size="sm" disabled>Cancelada</Button> : deletingId === booking.id ? <div className="flex flex-col gap-2 md:flex-row"><Input placeholder="Motivo (opcional)" value={deletionReason} onChange={(e) => setDeletionReason(e.target.value)} className="md:w-56" /><Button variant="destructive" size="sm" onClick={async () => {
                                const result = await adminDeleteBooking(booking.id, deletionReason || undefined);
                                if (result.success) { setDeletingId(null); setDeletionReason(""); flash(result.message || "Reserva cancelada."); await loadData(); } else { flash(result.message || "Nao foi possivel cancelar a reserva.", true); }
                            }}>Confirmar</Button><Button variant="outline" size="sm" onClick={() => { setDeletingId(null); setDeletionReason(""); }}>Voltar</Button></div> : <Button variant="ghost" size="icon" className="text-red-600" onClick={() => setDeletingId(booking.id)}><Trash2 className="h-4 w-4" /></Button>}</div></div>)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Admins</CardTitle><CardDescription>Criar e remover usuarios administrativos.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Email</Label><Input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} /></div><div className="space-y-2"><Label>Nome</Label><Input value={userFullName} onChange={(e) => setUserFullName(e.target.value)} /></div></div>
                        <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Senha</Label><Input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} /></div><div className="space-y-2"><Label>Perfil</Label><Select value={userRole} onValueChange={(value) => setUserRole(value as "ADMIN" | "SUPERADMIN")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ADMIN">Admin</SelectItem><SelectItem value="SUPERADMIN">Super Admin</SelectItem></SelectContent></Select></div></div>
                        <Button onClick={async () => {
                            const result = await createAdminUser({ email: userEmail, fullName: userFullName, password: userPassword, role: userRole });
                            if (result.success) { setUserEmail(""); setUserFullName(""); setUserPassword(""); setUserRole("ADMIN"); flash(result.message); await loadData(); } else { flash(result.message, true); }
                        }}>Criar Admin</Button>
                        <div className="space-y-2">{admins.map((admin) => <div key={admin.id} className="flex items-center justify-between rounded border bg-white p-3"><div><p className="font-medium">{admin.fullName}</p><p className="text-xs text-muted-foreground">{admin.email} • {admin.role}</p></div><Button variant="ghost" size="icon" className="text-red-600" onClick={async () => {
                            if (!confirm(`Excluir ${admin.fullName}?`)) return;
                            const result = await deleteAdminUser(admin.id);
                            if (result.success) { flash(result.message); await loadData(); } else { flash(result.message, true); }
                        }}><Trash2 className="h-4 w-4" /></Button></div>)}</div>
                    </CardContent>
                </Card>

                <div className="text-center"><Link href="/"><Button variant="outline">Voltar para o calendario</Button></Link></div>
            </main>
        </div>
    );
}
