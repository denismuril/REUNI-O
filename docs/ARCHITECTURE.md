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
| **Supabase** | - | Backend-as-a-Service (Auth + PostgreSQL) |
| **Resend** | - | Envio de emails transacionais |

## Estrutura de Pastas

```
REUNI-O/
├── app/                          # App Router (Next.js 14)
│   ├── actions/                  # Server Actions
│   │   ├── admin-actions.ts      # Ações administrativas
│   │   └── cancel-booking.ts     # Cancelamento de reservas
│   ├── admin/page.tsx            # Painel Administrativo
│   ├── api/                      # API Routes
│   ├── auth/callback/            # OAuth Callback
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
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── select.tsx
│       └── ...
│
├── lib/
│   ├── supabase/                 # Configuração Supabase
│   │   ├── client.ts             # Cliente browser
│   │   ├── server.ts             # Cliente server-side
│   │   └── middleware.ts         # Middleware auth
│   └── utils.ts                  # Funções utilitárias
│
├── types/                        # Definições TypeScript
│   ├── booking.ts                # Tipos de reserva
│   ├── supabase.ts               # Tipos gerados do Supabase
│   └── index.ts
│
├── supabase/                     # Migrations e configs
│   └── migrations/
│
├── public/                       # Assets estáticos
└── docs/                         # Documentação
```

## Modelo de Dados

### Tabelas Principais

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   branches  │     │    rooms    │     │  bookings   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (uuid)   │◄────│ branch_id   │     │ id (uuid)   │
│ name        │     │ id (uuid)   │◄────│ room_id     │
│ location    │     │ name        │     │ title       │
│ created_at  │     │ capacity    │     │ description │
└─────────────┘     │ color       │     │ start_time  │
                    │ created_at  │     │ end_time    │
                    └─────────────┘     │ creator_*   │
                                        │ user_id     │
                                        │ status      │
                                        │ created_at  │
                                        └─────────────┘

┌─────────────────────┐
│ admin_deletion_logs │
├─────────────────────┤
│ id (uuid)           │
│ booking_id          │
│ booking_title       │
│ booking_start_time  │
│ booking_end_time    │
│ room_name           │
│ creator_name        │
│ creator_email       │
│ deleted_by          │
│ deletion_reason     │
│ deleted_at          │
└─────────────────────┘
```

### Views

- `booking_details` - View materializada com detalhes completos das reservas

## Fluxo de Autenticação

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Usuário │────►│ /login       │────►│ Supabase Auth│
└──────────┘     └──────────────┘     └──────────────┘
                                              │
                                              ▼
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Home    │◄────│ /auth/callback│◄────│ OAuth Redirect│
└──────────┘     └──────────────┘     └──────────────┘
```

1. Usuário acessa `/login`
2. Autentica via email/senha ou OAuth (Google)
3. Supabase redireciona para `/auth/callback`
4. Middleware valida sessão e redireciona para `/`

## Fluxo de Cancelamento

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Solicitar   │────►│ Gerar OTP   │────►│ Enviar Email│
│ Cancelamento│     │ (6 dígitos) │     │ via Resend  │
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
- Gerenciar salas (CRUD com cores)
- Excluir reuniões (com auditoria)
- Visualizar logs de exclusão

**Acesso:** Credenciais hardcoded (ver `.env` para produção)

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `RESEND_API_KEY` | Chave API do Resend |
| `NEXT_PUBLIC_APP_URL` | URL pública da aplicação |

## Segurança

- **RLS (Row Level Security)** habilitado em todas as tabelas
- Autenticação via Supabase Auth
- Server Actions para operações sensíveis
- OTP via email para cancelamentos
- Logs de auditoria para ações admin
