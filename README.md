# REUNI-O 📅

Sistema corporativo de reserva de salas de reunião desenvolvido com Next.js 14, Supabase e Tailwind CSS.

## 🚀 Funcionalidades

- **Hierarquia Organizacional**: Empresa > Filiais > Salas de Reunião
- **Calendário Visual**: Visualização semanal e diária das reservas
- **Prevenção de Double Booking**: Validação em nível de banco de dados
- **Eventos Recorrentes**: Suporte a repetição diária e semanal (3 meses)
- **Hover com Detalhes**: Veja informações da reserva ao passar o mouse
- **Notificações por Email**: Templates prontos para integração

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Estilização**: Tailwind CSS + Shadcn/ui
- **Backend/DB**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Formulários**: React Hook Form + Zod
- **Linguagem**: TypeScript

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no [Supabase](https://supabase.com)

### Passos

1. **Clone o repositório**

   ```bash
   git clone https://github.com/seu-usuario/REUNI-O.git
   cd REUNI-O
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**

   ```bash
   cp .env.example .env.local
   ```

   Preencha com suas credenciais do Supabase:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
   ```

4. **Execute a migração no Supabase**

   No painel do Supabase, vá em SQL Editor e execute o conteúdo de:

   ```
   supabase/migrations/20260108180000_init_room_booking.sql
   ```

5. **Inicie o servidor de desenvolvimento**

   ```bash
   npm run dev
   ```

6. **Acesse** <http://localhost:3000>

## 📁 Estrutura do Projeto

```
REUNI-O/
├── app/
│   ├── api/
│   │   └── send-email/       # API de notificações
│   ├── auth/
│   │   └── callback/         # Callback de autenticação
│   ├── login/                # Página de login
│   ├── globals.css           # Estilos globais
│   ├── layout.tsx            # Layout raiz
│   └── page.tsx              # Página principal (calendário)
├── components/
│   ├── calendar/             # Componentes do calendário
│   │   ├── WeeklyView.tsx
│   │   ├── DailyView.tsx
│   │   └── EventBlock.tsx
│   ├── forms/
│   │   └── BookingForm.tsx   # Formulário de reserva
│   └── ui/                   # Componentes Shadcn/ui
├── lib/
│   ├── supabase/             # Clientes Supabase
│   └── utils.ts              # Funções utilitárias
├── types/
│   ├── supabase.ts           # Tipos do banco de dados
│   └── booking.ts            # Tipos do calendário
└── supabase/
    └── migrations/           # Migrações SQL
```

## 🔐 Banco de Dados

### Tabelas

- **profiles**: Usuários do sistema (vinculado ao auth.users)
- **branches**: Filiais/Localizações da empresa
- **rooms**: Salas de reunião por filial
- **bookings**: Reservas de salas

### Políticas RLS

- Todos os usuários autenticados podem visualizar dados
- Apenas admins podem criar/editar filiais e salas
- Usuários podem criar reservas e editar/cancelar apenas suas próprias

### Funções

- `check_availability()`: Verifica disponibilidade de horário
- `expand_recurring_booking()`: Expande reservas recorrentes
- `prevent_double_booking()`: Trigger para prevenir conflitos

## 🎨 Componentes

### WeeklyView

Grid de calendário Segunda a Sexta, 8h às 19h.

### DailyView

Visualização detalhada de um único dia com linha de hora atual.

### EventBlock

Bloco de evento com cores dinâmicas e tooltip com detalhes.

### BookingForm

Formulário completo com validação, seleção em cascata e suporte a recorrência.

## 📧 Notificações

A API de email está preparada para integração com:

- [Resend](https://resend.com)
- [SendGrid](https://sendgrid.com)
- Amazon SES

Templates incluídos:

- Confirmação de reserva
- Atualização de reserva
- Cancelamento
- Lembrete

## 🚧 Próximos Passos

- [ ] Integração real com serviço de email
- [ ] Dashboard administrativo
- [ ] Relatórios de utilização
- [ ] Integração com calendários externos (Google, Outlook)
- [ ] App mobile (React Native)

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

Desenvolvido com ❤️ usando Next.js e Supabase
