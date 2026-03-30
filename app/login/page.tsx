"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Calendar, Loader2, Lock, Mail, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [callbackUrl, setCallbackUrl] = useState("/");

    const router = useRouter();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setCallbackUrl(params.get("callbackUrl") || "/");
    }, []);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                const response = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: email.toLowerCase().trim(),
                        password,
                        fullName: fullName.trim(),
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Erro ao criar conta");
                }

                setMessage("Conta criada com sucesso! Fazendo login...");
            }

            const result = await signIn("credentials", {
                email: email.toLowerCase().trim(),
                password,
                redirect: false,
                callbackUrl,
            });

            if (result?.error) {
                throw new Error("Email ou senha incorretos");
            }

            router.push(result?.url || callbackUrl);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao autenticar");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />
            </div>

            <Card className="mx-4 w-full max-w-md border-0 bg-white/80 shadow-2xl backdrop-blur-sm">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto w-fit rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 shadow-lg">
                        <Calendar className="h-10 w-10 text-white" />
                    </div>
                    <div>
                        <CardTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-2xl font-bold text-transparent">
                            REUNI-O
                        </CardTitle>
                        <CardDescription className="text-base">
                            Sistema de Reserva de Salas de Reuniao
                        </CardDescription>
                    </div>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-600">
                                {message}
                            </div>
                        )}

                        {isSignUp && (
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Nome Completo</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="fullName"
                                        value={fullName}
                                        onChange={(event) => setFullName(event.target.value)}
                                        className="pl-10"
                                        required={isSignUp}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
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
                            className="text-sm text-muted-foreground transition-colors hover:text-primary"
                        >
                            {isSignUp ? "Ja tem uma conta? Faca login" : "Nao tem uma conta? Cadastre-se"}
                        </button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
