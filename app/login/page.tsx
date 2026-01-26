"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Calendar, Mail, Lock, Loader2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                // Cadastro via API
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: email.toLowerCase().trim(),
                        password,
                        fullName: fullName.trim(),
                    }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Erro ao criar conta");
                }

                setMessage("Conta criada com sucesso! Fazendo login...");

                // Auto-login após cadastro
                const result = await signIn("credentials", {
                    email: email.toLowerCase().trim(),
                    password,
                    redirect: false,
                });

                if (result?.error) {
                    throw new Error(result.error);
                }

                router.push("/");
                router.refresh();
            } else {
                // Login via NextAuth
                const result = await signIn("credentials", {
                    email: email.toLowerCase().trim(),
                    password,
                    redirect: false,
                });

                if (result?.error) {
                    throw new Error("Email ou senha incorretos");
                }

                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao autenticar");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md mx-4 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-2xl w-fit shadow-lg">
                        <Calendar className="h-10 w-10 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            REUNI-O
                        </CardTitle>
                        <CardDescription className="text-base">
                            Sistema de Reserva de Salas de Reunião
                        </CardDescription>
                    </div>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {/* Mensagens de erro/sucesso */}
                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-600 text-sm">
                                {message}
                            </div>
                        )}

                        {/* Nome (apenas no cadastro) */}
                        {isSignUp && (
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Nome Completo</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="fullName"
                                        type="text"
                                        placeholder="Seu nome completo"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="pl-10"
                                        required={isSignUp}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        {/* Senha */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSignUp ? "Criar Conta" : "Entrar"}
                        </Button>

                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                                setMessage(null);
                            }}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            {isSignUp
                                ? "Já tem uma conta? Faça login"
                                : "Não tem uma conta? Cadastre-se"}
                        </button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
