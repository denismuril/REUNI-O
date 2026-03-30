# REUNI-O

Sistema corporativo de reserva de salas de reuniao desenvolvido com Next.js 14, Prisma, MySQL e Tailwind CSS.

## Principais funcionalidades

- Calendario visual semanal e diario
- Reserva de salas com validacao no servidor
- Eventos recorrentes
- Cancelamento com confirmacao por email
- Painel administrativo para filiais, salas, usuarios e relatorios
- Autenticacao com NextAuth

## Stack

- Next.js 14
- TypeScript
- Prisma
- MySQL
- NextAuth
- Tailwind CSS
- shadcn/ui

## Inicio rapido

```bash
git clone https://github.com/seu-usuario/REUNI-O.git
cd REUNI-O
npm install
cp .env.example .env.local
npx prisma generate
npx prisma db push
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Variaveis de ambiente

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

Observacao: o painel admin nao usa mais `ADMIN_USERNAME` ou `ADMIN_PASSWORD`. O acesso administrativo depende do usuario do banco com `role = ADMIN` ou `SUPERADMIN`.

## Deploy Linux

O repositorio inclui os arquivos base para deploy no servidor:

- [ecosystem.config.js](ecosystem.config.js): processo PM2 para subir a app na porta `3000`
- [deploy/nginx/reuniao.bexp.com.br.conf](deploy/nginx/reuniao.bexp.com.br.conf): configuracao Nginx pronta para `reuniao.bexp.com.br`
- [app/api/health/route.ts](app/api/health/route.ts): endpoint de health check em `/api/health`

Fluxo sugerido:

```bash
npm install
npm run build
pm2 start ecosystem.config.js
curl -i http://127.0.0.1:3000/api/health
```

Depois valide pelo dominio:

```bash
curl -i https://reuniao.bexp.com.br/api/health
curl -i https://reuniao.bexp.com.br/api/auth/signin
```

Importante: nao crie um `location /api/` separado para outro backend no mesmo dominio, porque isso quebra `/api/auth/*` do NextAuth.

## Documentacao

- [docs/INSTALL.md](docs/INSTALL.md)
- [docs/DEPLOY.md](docs/DEPLOY.md)
- [docs/DEPLOY_LINUX.md](docs/DEPLOY_LINUX.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
