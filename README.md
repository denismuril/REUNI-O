# REUNI-O 📅

Sistema corporativo de reserva de salas de reunião desenvolvido com Next.js 14, Supabase e Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwind-css)

## 🚀 Funcionalidades

### Usuários

- **Calendário Visual**: Visualização semanal e diária das reservas
- **Reserva de Salas**: Formulário completo com validação
- **Eventos Recorrentes**: Suporte a repetição diária e semanal
- **Cancelamento com OTP**: Confirmação segura via email
- **Hover com Detalhes**: Informações da reserva ao passar o mouse

### Administração

- **Gestão de Filiais**: CRUD completo de filiais/localizações
- **Gestão de Salas**: CRUD com cores personalizadas
- **Exclusão de Reuniões**: Com auditoria e registro de motivo
- **Logs de Ações**: Histórico de exclusões administrativas

### Técnico

- **Prevenção de Double Booking**: Validação em nível de banco
- **RLS (Row Level Security)**: Segurança no nível do banco de dados
- **Server Actions**: Operações seguras no servidor

## 🛠️ Tech Stack

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 14.x | Framework React (App Router) |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | 3.x | Estilização |
| Supabase | - | Backend + Auth + PostgreSQL |
| Resend | - | Emails transacionais |
| shadcn/ui | - | Componentes UI |

## 📦 Início Rápido

```bash
# Clone
git clone https://github.com/seu-usuario/REUNI-O.git
cd REUNI-O

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Execute em desenvolvimento
npm run dev
```

Acesse: **<http://localhost:3000>**

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [📋 Instalação](docs/INSTALL.md) | Configuração do ambiente local |
| [🚀 Deploy](docs/DEPLOY.md) | Deploy em servidor Linux |
| [🏗️ Arquitetura](docs/ARCHITECTURE.md) | Estrutura e fluxos do sistema |

## 📁 Estrutura do Projeto

```
REUNI-O/
├── app/                      # Páginas Next.js (App Router)
│   ├── actions/              # Server Actions
│   ├── admin/                # Painel Administrativo
│   ├── api/                  # API Routes
│   ├── auth/                 # Auth Callback
│   ├── login/                # Login
│   └── page.tsx              # Calendário Principal
├── components/
│   ├── calendar/             # Componentes de Calendário
│   ├── forms/                # Formulários
│   └── ui/                   # Componentes UI (shadcn)
├── lib/
│   └── supabase/             # Clientes Supabase
├── types/                    # TypeScript Types
├── docs/                     # Documentação
│   ├── INSTALL.md
│   ├── DEPLOY.md
│   └── ARCHITECTURE.md
└── supabase/                 # Migrations
```

## 🔐 Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Resend (Email)
RESEND_API_KEY=re_xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🗃️ Modelo de Dados

```
branches (Filiais)
    └── rooms (Salas)
            └── bookings (Reservas)

admin_deletion_logs (Auditoria)
```

## 🚧 Roadmap

- [x] Sistema de reservas
- [x] Cancelamento com OTP
- [x] Painel administrativo
- [x] Logs de auditoria
- [ ] Integração Google Calendar
- [ ] App mobile (React Native)
- [ ] Relatórios de utilização
- [ ] Notificações push

## 👥 Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: nova feature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

Desenvolvido com ❤️ usando Next.js e Supabase
