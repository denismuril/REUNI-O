# REUNI-O 📅

Sistema corporativo de reserva de salas de reunião desenvolvido com Next.js 14, Prisma, MySQL e Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwind-css)

## 🚀 Funcionalidades

### Usuários

- **Calendário Visual**: Visualização semanal e diária das reservas
- **Reserva de Salas**: Formulário completo com validação
- **Eventos Recorrentes**: Suporte a repetição diária, semanal, mensal e personalizada
- **Cancelamento com OTP**: Confirmação segura via email
- **Hover com Detalhes**: Informações da reserva ao passar o mouse
- **Reservas de Visitantes**: Suporte seguro para reservas sem login (Guest)

### Administração

- **Gestão de Filiais**: CRUD completo de filiais/localizações
- **Gestão de Salas**: CRUD com capacidade configurável
- **Gestão de Usuários Admin**: Criar/excluir administradores do sistema
- **Exclusão de Reuniões**: Com auditoria e registro de motivo
- **Pesquisa de Reuniões**: Busca por título, sala ou responsável

### Técnico & Segurança

- **Prevenção de Double Booking**: Validação em nível de servidor
- **NextAuth.js**: Autenticação segura com sessões
- **Server Actions**: Validações de domínio e lógica de negócio no servidor
- **Zod Validation**: Validação robusta de dados

## 🛠️ Tech Stack

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 14.x | Framework React (App Router) |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | 3.x | Estilização |
| Prisma | 5.x | ORM para MySQL |
| MySQL | 8.x | Banco de dados relacional |
| NextAuth.js | 4.x | Autenticação |
| bcryptjs | - | Hash de senhas |
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

# Gere o cliente Prisma e aplique migrações
npx prisma generate
npx prisma db push

# Execute em desenvolvimento
npm run dev
```

Acesse: **<http://localhost:3000>**

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [📋 Instalação](docs/INSTALL.md) | Configuração do ambiente local |
| [🐧 Deploy Linux](docs/DEPLOY_LINUX.md) | Guia passo-a-passo para servidor Linux |
| [🏗️ Arquitetura](docs/ARCHITECTURE.md) | Estrutura e fluxos do sistema |

## 📁 Estrutura do Projeto

```
REUNI-O/
├── app/                      # Páginas Next.js (App Router)
│   ├── actions/              # Server Actions (Lógica Segura)
│   ├── admin/                # Painel Administrativo
│   ├── api/                  # API Routes (Auth, Cron)
│   ├── login/                # Login
│   └── page.tsx              # Calendário Principal
├── components/
│   ├── calendar/             # Componentes de Calendário
│   ├── forms/                # Formulários
│   └── ui/                   # Componentes UI (shadcn)
├── lib/
│   ├── prisma/               # Cliente Prisma (Singleton)
│   ├── auth/                 # Configuração NextAuth
│   └── utils.ts              # Funções utilitárias
├── prisma/
│   └── schema.prisma         # Schema do banco de dados
├── types/                    # TypeScript Types
└── docs/                     # Documentação
```

## 🔐 Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL="mysql://user:password@host:3306/database"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua_chave_secreta_aqui

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=sua_senha_admin

# Resend (Email)
RESEND_API_KEY=re_xxx
ALLOWED_EMAIL_DOMAIN=suaempresa.com.br

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🗃️ Modelo de Dados

```
branches (Filiais)
    └── rooms (Salas)
            └── bookings (Reservas)

users (Usuários autenticados)
cancellation_tokens (Tokens OTP)
```

## 🚧 Roadmap

- [x] Sistema de reservas
- [x] Cancelamento com OTP
- [x] Painel administrativo
- [x] Suporte a Guest Users
- [x] Migração para MySQL/Prisma
- [x] Recorrência avançada (mensal, personalizada)
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

Desenvolvido com ❤️ usando Next.js e Prisma
