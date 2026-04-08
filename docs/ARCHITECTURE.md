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
| **Resend** | 6.x | Envio de emails transacionais |
| **Recharts** | 3.x | Gráficos e relatórios |
| **Zod** | 3.x | Validação de dados |
| **shadcn/ui** | - | Componentes UI (Radix + Tailwind) |

## Estrutura de Pastas

```
REUNI-O/
├── app/                              # App Router (Next.js 14)
│   ├── actions/                      # Server Actions
│   │   ├── admin-actions.ts          # Ações administrativas (CRUD filiais/salas)
│   │   ├── booking.ts                # Reservas e consultas
│   │   ├── cancel-booking.ts         # Cancelamento de reservas com OTP
│   │   ├── email-actions.ts          # Envio de emails (confirmação/cancelamento)
│   │   ├── report-actions.ts         # Relatórios e estatísticas
│   │   └── user-actions.ts           # CRUD de usuários admin
│   ├── admin/
│   │   ├── page.tsx                  # Painel Administrativo
│   │   └── reports/page.tsx          # Painel de Relatórios
│   ├── api/                          # API Routes
│   │   ├── admin/auth/               # Autenticação admin (legado)
│   │   ├── auth/[...nextauth]/       # NextAuth endpoints
│   │   ├── cron/reminders/           # Job de lembretes por email
│   │   ├── health/                   # Health check
│   │   └── send-email/               # Endpoint de envio de email
│   ├── auth/                         # Páginas de autenticação
│   ├── login/page.tsx                # Página de Login
│   ├── globals.css                   # Estilos globais
│   ├── layout.tsx                    # Layout raiz
│   └── page.tsx                      # Página principal (Calendário)
│
├── components/
│   ├── calendar/                     # Componentes de calendário
│   │   ├── DailyView.tsx             # Visualização diária
│   │   ├── WeeklyView.tsx            # Visualização semanal
│   │   ├── EventBlock.tsx            # Bloco de evento no grid
│   │   └── index.ts                  # Exports
│   ├── charts/                       # Componentes de gráficos (Recharts)
│   │   ├── OccupancyChart.tsx        # Gráfico de ocupação por sala
│   │   ├── PeakHoursChart.tsx        # Gráfico de horários de pico
│   │   └── TopUsersTable.tsx         # Tabela dos maiores usuários
│   ├── forms/
│   │   ├── BookingForm.tsx           # Formulário de reserva completo
│   │   └── index.ts                  # Exports
│   ├── modals/
│   │   └── BookingDetailsModal.tsx   # Modal de detalhes da reserva
│   ├── providers/
│   │   └── session-provider.tsx      # Provider NextAuth (SessionProvider)
│   └── ui/                           # Componentes UI (shadcn/ui)
│
├── hooks/
│   └── useBookingCancellation.ts     # Hook de cancelamento com OTP
│
├── lib/
│   ├── auth/                         # Autenticação
│   │   ├── config.ts                 # Configuração NextAuth (CredentialsProvider)
│   │   └── index.ts                  # Helpers: getSession, isAdmin, requireAdmin
│   ├── prisma/                       # Cliente Prisma
│   │   └── client.ts                 # Singleton do Prisma
│   ├── email-templates.ts            # Templates HTML de email
│   ├── logger.ts                     # Logger de auditoria
│   ├── rate-limit.ts                 # Rate limiter em memória
│   └── utils.ts                      # Funções utilitárias (datas, recorrência)
│
├── prisma/
│   └── schema.prisma                 # Schema do banco de dados
│
├── types/                            # Definições TypeScript
│   ├── booking.ts                    # Tipos de reserva
│   ├── database.ts                   # Tipos do banco
│   ├── index.ts                      # Re-exports
│   └── next-auth.d.ts               # Extensão de tipos NextAuth
│
├── deploy/                           # Configuração de deploy
│   └── nginx/                        # Config Nginx
│
├── middleware.ts                      # Middleware de autenticação e rotas
├── ecosystem.config.js                # PM2 (produção)
└── docs/                              # Documentação
```

## Modelo de Dados

### Tabelas Principais

Todas as tabelas usam o prefixo `reunio_` para compatibilidade com banco compartilhado.

```
┌──────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│   reunio_branches│     │   reunio_rooms   │     │  reunio_bookings  │
├──────────────────┤     ├──────────────────┤     ├───────────────────┤
│ id (uuid)        │◄────│ branchId         │     │ id (uuid)         │
│ name             │     │ id (uuid)        │◄────│ roomId            │
│ location         │     │ name             │     │ userId            │
│ address          │     │ capacity         │     │ creatorName       │
│ timezone         │     │ equipmentList    │     │ creatorEmail      │
│ isActive         │     │ description      │     │ title             │
│ createdAt        │     │ floor            │     │ description       │
│ updatedAt        │     │ isActive         │     │ startTime         │
└──────────────────┘     │ createdAt        │     │ endTime           │
                         │ updatedAt        │     │ isRecurring       │
                         └──────────────────┘     │ recurrenceType    │
                                                  │ parentBookingId   │
                                                  │ status            │
                                                  │ createdAt         │
                                                  │ updatedAt         │
                                                  └───────────────────┘

┌──────────────────┐     ┌────────────────────────────┐
│  reunio_users    │     │ reunio_cancellation_tokens │
├──────────────────┤     ├────────────────────────────┤
│ id (uuid)        │     │ id (uuid)                  │
│ email            │     │ bookingId                  │
│ password (hash)  │     │ token                      │
│ fullName         │     │ createdAt                  │
│ role             │     │ expiresAt                  │
│ avatarUrl        │     └────────────────────────────┘
│ createdAt        │
│ updatedAt        │
└──────────────────┘
```

### Enums

| Enum | Valores | Uso |
|------|---------|-----|
| `Role` | `USER`, `ADMIN`, `SUPERADMIN` | Nível de acesso do usuário |
| `Status` | `CONFIRMED`, `CANCELLED`, `PENDING` | Status da reserva |

### Relações

- `Branch` → `Room` (1:N)
- `Room` → `Booking` (1:N)
- `User` → `Booking` (1:N, opcional)
- `Booking` → `Booking` (1:N, auto-relação para recorrência via `parentBookingId`)
- `Booking` → `CancellationToken` (1:N)

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
3. Sessão JWT é criada (validade: 30 dias)
4. Middleware valida sessão e redireciona conforme necessário

**Detalhes de implementação:**

- Senhas são armazenadas com `bcrypt` (12 rounds)
- Se uma senha em texto puro for encontrada no banco, ela é automaticamente convertida para hash no primeiro login
- O middleware protege `/admin` exigindo `role = ADMIN` ou `SUPERADMIN`

## Middleware de Rotas

O `middleware.ts` controla o acesso às rotas:

| Rota | Acesso |
|------|--------|
| `/login` | Pública |
| `/` | Pública (calendário) |
| `/api/auth/*` | Pública (NextAuth) |
| `/api/cron/*` | Pública (protegida por `CRON_SECRET`) |
| `/api/send-email` | Pública |
| `/admin/*` | Autenticado + `role = ADMIN` ou `SUPERADMIN` |

## Fluxo de Cancelamento com OTP

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

O hook `useBookingCancellation` gerencia todo o fluxo no frontend.

## Notificações por Email

O sistema envia 3 tipos de email via **Resend**:

| Tipo | Template | Quando |
|------|----------|--------|
| Confirmação | `getBookingConfirmationTemplate` | Reserva criada |
| Lembrete | `getBookingReminderTemplate` | 1 hora antes da reunião (via cron) |
| Cancelamento | `getBookingCancellationTemplate` | Reserva cancelada |

**Remetente:** `RESERVA <noreply@reuniao.bexp.com.br>`

Os horários nos emails são formatados no timezone `America/Sao_Paulo`.

## Painel Administrativo

O painel admin (`/admin`) permite:

- Gerenciar filiais (CRUD)
- Gerenciar salas (CRUD com capacidade, andar e equipamentos)
- Gerenciar usuários admin (criar/excluir, definir role)
- Excluir reuniões (com motivo registrado)
- Pesquisar reuniões por título, sala ou responsável

**Acesso:** Login via email/senha de usuário com `role = ADMIN` ou `SUPERADMIN` no banco de dados.

### Relatórios (`/admin/reports`)

O painel de relatórios oferece:

- **Ocupação por sala** — Gráfico de barras com total de reservas e horas por sala
- **Horários de pico** — Distribuição de reservas por hora do dia (8h–18h)
- **Top usuários** — Ranking dos usuários com mais reservas
- **Resumo** — Totais de reservas, horas, média diária, sala mais usada e dia de pico

## Eventos Recorrentes

O sistema suporta 4 tipos de recorrência:

| Tipo | Comportamento |
|------|---------------|
| `daily` | Dias úteis (seg–sex) |
| `weekly` | Mesmo dia da semana |
| `monthly` | Mesmo dia do mês (`same_day`) ou mesma ocorrência do dia da semana (`same_weekday`) |
| `custom` | Dias da semana selecionados pelo usuário |

As datas são geradas pela função `generateRecurringDates` em `lib/utils.ts`. Cada ocorrência é uma reserva individual vinculada à principal via `parentBookingId`.

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `DATABASE_URL` | ✅ | URL de conexão MySQL |
| `NEXTAUTH_URL` | ✅ | URL pública da aplicação |
| `NEXTAUTH_URL_INTERNAL` | ⚠️ | URL interna (recomendado em produção: `http://127.0.0.1:3000`) |
| `NEXTAUTH_SECRET` | ✅ | Chave secreta para JWT |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL pública da aplicação (usada em emails) |
| `PORT` | ❌ | Porta do servidor (padrão: 3000) |
| `RESEND_API_KEY` | ⚠️ | Chave API do Resend (emails não são enviados sem ela) |
| `ALLOWED_EMAIL_DOMAIN` | ❌ | Domínio permitido para emails de reserva |
| `CRON_SECRET` | ⚠️ | Segredo para autenticação dos cron jobs |

> **Nota:** As variáveis `ADMIN_USERNAME` e `ADMIN_PASSWORD` foram removidas. O acesso administrativo é feito exclusivamente via usuários com `role = ADMIN` ou `SUPERADMIN` no banco de dados.

## Segurança

- **Prisma ORM** com queries parametrizadas (prevenção SQL injection)
- Autenticação via **NextAuth.js** com sessões JWT (30 dias)
- **Server Actions** para operações sensíveis (com `"use server"`)
- **Tokens OTP** via email para cancelamentos pelo usuário
- Validação com **Zod** em formulários e server actions
- **Rate limiting** em memória para prevenir abuso (3 tentativas / 15 min)
- **Logger de auditoria** registra ações como login, criação/cancelamento de reservas
- **Middleware** protege rotas administrativas por role
- Senhas armazenadas com **bcrypt** (12 rounds)
- Conversão automática de senhas em texto puro para hash
