# Arquitetura do Sistema REUNI-O

## Visão Geral

O **REUNI-O** é um sistema de agendamento de salas de reunião desenvolvido com tecnologias modernas para garantir escalabilidade, segurança e facilidade de uso.

## Stack Tecnológico

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Next.js** | 14.x | Framework React com App Router |
| **React** | 18.x | Biblioteca de UI |
| **TypeScript** | 5.x | Tipagem estática |
| **Tailwind CSS** | 3.x | Estilização utilitária |
| **Prisma** | 5.x | ORM para MySQL |
| **MySQL** | 8.x | Banco de dados relacional |
| **NextAuth.js** | 4.x | Autenticação |
| **Resend** | - | Envio de emails transacionais |

## Estrutura de Pastas

```
REUNI-O/
├── app/                          # App Router (Next.js 14)
│   ├── actions/                  # Server Actions
│   │   ├── admin-actions.ts      # Ações administrativas
│   │   ├── booking.ts            # Reservas e consultas
│   │   ├── cancel-booking.ts     # Cancelamento de reservas
│   │   └── user-actions.ts       # CRUD de usuários admin
│   ├── admin/page.tsx            # Painel Administrativo
│   ├── api/                      # API Routes
│   │   ├── auth/[...nextauth]/   # NextAuth endpoints
│   │   └── cron/                 # Jobs agendados
│   ├── login/page.tsx            # Página de Login
│   ├── globals.css               # Estilos globais
│   ├── layout.tsx                # Layout raiz
│   └── page.tsx                  # Página principal (Calendário)
│
├── components/
│   ├── calendar/                 # Componentes de calendário
│   │   ├── DailyView.tsx         # Visualização diária
│   │   ├── WeeklyView.tsx        # Visualização semanal
│   │   └── EventBlock.tsx        # Bloco de evento
│   ├── forms/
│   │   └── BookingForm.tsx       # Formulário de reserva
│   └── ui/                       # Componentes UI (shadcn/ui)
│
├── lib/
│   ├── prisma/                   # Cliente Prisma
│   │   └── client.ts             # Singleton do Prisma
│   ├── auth/                     # Configuração NextAuth
│   └── utils.ts                  # Funções utilitárias
│
├── prisma/
│   └── schema.prisma             # Schema do banco de dados
│
├── types/                        # Definições TypeScript
│   ├── database.ts               # Tipos do banco
│   ├── booking.ts                # Tipos de reserva
│   └── index.ts
│
└── docs/                         # Documentação
```

## Modelo de Dados

### Tabelas Principais

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   branches  │     │    rooms    │     │  bookings   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (uuid)   │◄────│ branchId    │     │ id (uuid)   │
│ name        │     │ id (uuid)   │◄────│ roomId      │
│ location    │     │ name        │     │ title       │
│ timezone    │     │ capacity    │     │ description │
│ isActive    │     │ isActive    │     │ startTime   │
│ createdAt   │     │ createdAt   │     │ endTime     │
└─────────────┘     └─────────────┘     │ creatorName │
                                        │ creatorEmail│
                                        │ userId      │
                                        │ status      │
                                        │ isRecurring │
                                        └─────────────┘

┌─────────────┐     ┌─────────────────────┐
│    users    │     │ cancellation_tokens │
├─────────────┤     ├─────────────────────┤
│ id (uuid)   │     │ id (uuid)           │
│ email       │     │ token               │
│ fullName    │     │ bookingId           │
│ createdAt   │     │ expiresAt           │
└─────────────┘     │ usedAt              │
                    └─────────────────────┘
```

## Fluxo de Autenticação

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Usuário │────►│ /login       │────►│ NextAuth.js  │
└──────────┘     └──────────────┘     └──────────────┘
                                              │
                                              ▼
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Home    │◄────│  Sessão JWT  │◄────│ Validação    │
└──────────┘     └──────────────┘     └──────────────┘
```

1. Usuário acessa `/login`
2. Autentica via email/senha (NextAuth CredentialsProvider)
3. Sessão JWT é criada e armazenada
4. Middleware valida sessão e redireciona para `/`

## Fluxo de Cancelamento

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Solicitar   │────►│ Gerar Token │────►│ Enviar Email│
│ Cancelamento│     │ (UUID)      │     │ via Resend  │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Reserva     │◄────│ Validar OTP │◄────│ Inserir OTP │
│ Cancelada   │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Painel Administrativo

O painel admin (`/admin`) permite:

- Gerenciar filiais (CRUD)
- Gerenciar salas (CRUD com capacidade)
- Gerenciar usuários admin (criar/excluir)
- Excluir reuniões (com motivo)
- Pesquisar reuniões por título, sala ou responsável

**Acesso:**

- **Primeiro acesso:** Usa credenciais de `ADMIN_USERNAME`/`ADMIN_PASSWORD` do `.env`
- **Após criar admin no banco:** Login via email/senha armazenados no banco (com bcrypt)

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão MySQL |
| `NEXTAUTH_URL` | URL base da aplicação |
| `NEXTAUTH_SECRET` | Chave secreta para JWT |
| `ADMIN_USERNAME` | Usuário do painel admin |
| `ADMIN_PASSWORD` | Senha do painel admin |
| `RESEND_API_KEY` | Chave API do Resend |
| `NEXT_PUBLIC_APP_URL` | URL pública da aplicação |

## Segurança

- **Prisma ORM** com queries parametrizadas (prevenção SQL injection)
- Autenticação via **NextAuth.js** com sessões JWT
- **Server Actions** para operações sensíveis
- **Tokens OTP** via email para cancelamentos
- Validação com **Zod** em formulários e server actions
