# Deploy Linux - reuniao.bexp.com.br

Este guia usa os arquivos versionados do repositorio para subir o REUNI-O com:

- Next.js 14
- PM2
- Nginx
- NextAuth
- MySQL

## 1. Pre-requisitos

```bash
sudo apt update
sudo apt install -y curl git nginx
```

Instale Node.js 20 e PM2:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 2. Baixar o projeto

```bash
mkdir -p ~/apps
cd ~/apps
git clone https://github.com/denismuril/REUNI-O.git
cd REUNI-O
npm install
```

## 3. Configurar ambiente

Crie um arquivo `.env.production.local`:

```env
DATABASE_URL="mysql://usuario:senha@host:3306/reuniodb"

NEXTAUTH_URL=https://reuniao.bexp.com.br
NEXTAUTH_URL_INTERNAL=http://127.0.0.1:3000
NEXTAUTH_SECRET=gere_um_segredo_forte

NEXT_PUBLIC_APP_URL=https://reuniao.bexp.com.br
PORT=3000

RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
ALLOWED_EMAIL_DOMAIN=bexp.com.br

CRON_SECRET=seu_segredo_cron_aqui
```

Gere um segredo seguro:

```bash
openssl rand -base64 32
```

Observacoes:

- Nao use mais `ADMIN_USERNAME` ou `ADMIN_PASSWORD`; o painel admin usa usuarios do banco com `role = ADMIN` ou `SUPERADMIN`.
- `NEXTAUTH_URL_INTERNAL=http://127.0.0.1:3000` ajuda o servidor a resolver callbacks localmente.

## 4. Banco e build

```bash
npx prisma migrate deploy
npm run build
```

## 5. Subir com PM2

O repositorio inclui [ecosystem.config.js](../ecosystem.config.js).

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 status
```

Configure inicializacao automatica:

```bash
pm2 startup
```

Execute o comando que o PM2 imprimir e depois:

```bash
pm2 save
```

## 6. Validar a app antes do Nginx

Teste localmente no servidor:

```bash
curl -i http://127.0.0.1:3000/api/health
curl -i http://127.0.0.1:3000/api/auth/signin
```

Se `127.0.0.1:3000` nao responder, o problema ainda esta no processo Node/PM2 e nao no Nginx.

## 7. Configurar Nginx

O repositorio inclui [deploy/nginx/reuniao.bexp.com.br.conf](../deploy/nginx/reuniao.bexp.com.br.conf).

Copie o arquivo para o servidor:

```bash
sudo cp deploy/nginx/reuniao.bexp.com.br.conf /etc/nginx/sites-available/reuniao.bexp.com.br
sudo ln -sf /etc/nginx/sites-available/reuniao.bexp.com.br /etc/nginx/sites-enabled/reuniao.bexp.com.br
sudo nginx -t
sudo systemctl reload nginx
```

Importante:

- Nao crie um `location /api/` separado para outro backend neste dominio.
- `/api/auth/*` precisa chegar no Next.js para o NextAuth funcionar.
- Se voce tiver outra API no servidor, use outro subdominio como `api.bexp.com.br` ou outro prefixo como `/backend/`.

## 8. Configurar HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d reuniao.bexp.com.br
```

Depois recarregue:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Testes finais

```bash
curl -i https://reuniao.bexp.com.br/api/health
curl -i https://reuniao.bexp.com.br/api/auth/signin
curl -i https://reuniao.bexp.com.br/admin
```

Resultados esperados:

- `/api/health` retorna JSON com `status: ok`
- `/api/auth/signin` responde pela aplicacao NextAuth
- `/admin` redireciona para `/login` quando nao ha sessao

## 10. Atualizacao de versao

```bash
cd ~/apps/REUNI-O
git pull origin main
npm install
npx prisma migrate deploy
npm run build
pm2 restart reunio
```

## 11. Troubleshooting

Ver o processo:

```bash
pm2 logs reunio
pm2 status
ss -ltnp | grep 3000
```

Ver o Nginx:

```bash
sudo nginx -t
sudo systemctl status nginx
```

Se `https://reuniao.bexp.com.br/api/auth/error` retornar `{"detail":"Not Found"}`, a requisicao nao esta chegando no Next.js. Isso normalmente significa um `location /api/` errado ou upstream incorreto no Nginx.
