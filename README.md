# REUNI-O

Sistema corporativo de reserva de salas de reunião desenvolvido com Next.js 14, Prisma, MySQL e Tailwind CSS.

## Principais funcionalidades

- Calendário visual semanal e diário
- Reserva de salas com validação no servidor
- Eventos recorrentes (diário, semanal, mensal e customizado)
- Cancelamento com confirmação por email (OTP)
- Notificações por email (confirmação, lembrete 1h antes, cancelamento)
- Painel administrativo para filiais, salas, usuários e relatórios
- Relatórios com gráficos de ocupação, horários de pico e ranking de usuários
- Autenticação com NextAuth (JWT)
- Rate limiting e logger de auditoria

## Stack

- Next.js 14
- TypeScript
- Prisma
- MySQL
- NextAuth
- Tailwind CSS
- shadcn/ui
- Resend (emails)
- Recharts (gráficos)
- Zod (validação)

## Inicio rapido

```bash
git clone https://github.com/denismuril/REUNI-O.git
cd REUNI-O
npm install
cp .env.example .env.local
npx prisma generate
npx prisma db push
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Variaveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```env
DATABASE_URL="mysql://user:password@host:3306/database"

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL_INTERNAL=http://127.0.0.1:3000
NEXTAUTH_SECRET=sua_chave_secreta_aqui

NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000

RESEND_API_KEY=re_xxx
ALLOWED_EMAIL_DOMAIN=suaempresa.com.br

CRON_SECRET=seu_segredo_cron_aqui
```

Observação: o painel admin não usa `ADMIN_USERNAME` ou `ADMIN_PASSWORD`. O acesso administrativo depende do usuário do banco com `role = ADMIN` ou `SUPERADMIN`.

## Deploy Linux

O repositório inclui os arquivos base para deploy no servidor:

- [ecosystem.config.js](ecosystem.config.js): processo PM2 para subir a app na porta `3000`
- [deploy/nginx/reuniao.bexp.com.br.conf](deploy/nginx/reuniao.bexp.com.br.conf): configuração Nginx pronta para `reuniao.bexp.com.br`
- [app/api/health/route.ts](app/api/health/route.ts): endpoint de health check em `/api/health`

Fluxo sugerido:

```bash
npm install
npm run build
pm2 start ecosystem.config.js
curl -i http://127.0.0.1:3000/api/health
```

Depois valide pelo domínio:

```bash
curl -i https://reuniao.bexp.com.br/api/health
curl -i https://reuniao.bexp.com.br/api/auth/signin
```

Importante: não crie um `location /api/` separado para outro backend no mesmo domínio, porque isso quebra `/api/auth/*` do NextAuth.

## Documentação

- [docs/INSTALL.md](docs/INSTALL.md) — Guia de instalação e configuração local
- [docs/DEPLOY.md](docs/DEPLOY.md) — Guia rápido de deploy
- [docs/DEPLOY_LINUX.md](docs/DEPLOY_LINUX.md) — Deploy completo em Linux com PM2 e Nginx
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Arquitetura, modelo de dados e fluxos do sistema
