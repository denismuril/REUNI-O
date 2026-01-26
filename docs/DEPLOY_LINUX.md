# Guia de Deploy em Servidor Linux (Ubuntu/Debian)

Este guia descreve os passos para hospedar a aplicação **REUNI-O** em um servidor Linux usando Node.js, PM2 e Nginx, conectado ao banco de dados **MySQL**.

## 📋 Pré-requisitos

- Servidor Linux (Ubuntu 20.04 ou superior recomendado)
- Acesso SSH ao servidor
- Node.js 20+ e npm
- Acesso ao banco MySQL (sgbd1.bexp.com.br já configurado)
- Domínio configurado (opcional, mas recomendado)

---

## 1. Preparação do Servidor

Atualize o sistema e instale as dependências básicas:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx
```

## 2. Instalação do Node.js (via NVM)

```bash
# Baixar instalador
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recarregar bash
source ~/.bashrc

# Instalar Node.js LTS (Versão 20 recomendada para Next.js 14)
nvm install 20
nvm use 20
nvm alias default 20
```

Instale o PM2 (gerenciador de processos):

```bash
npm install -g pm2
```

## 3. Clone do Projeto

```bash
mkdir -p ~/apps
cd ~/apps
git clone https://github.com/denismuril/REUNI-O.git
cd REUNI-O
```

## 4. Instalação de Dependências

```bash
npm install
```

## 5. Configuração de Variáveis de Ambiente

Crie o arquivo `.env.local`:

```bash
nano .env.local
```

Cole o conteúdo abaixo (já configurado para seu ambiente):

```env
# -------------------------------------------
# MySQL (Prisma)
# -------------------------------------------
DATABASE_URL="mysql://usr_leonardo:4Fy!GGnyodiE4fJRV@6x@sgbd1.bexp.com.br:3306/reuniodb"

# -------------------------------------------
# NextAuth
# -------------------------------------------
NEXTAUTH_URL=https://seu-dominio.bexp.com.br
NEXTAUTH_SECRET=gere_uma_chave_secreta_com_openssl_rand_base64_32

# -------------------------------------------
# Resend (Envio de Emails)
# -------------------------------------------
RESEND_API_KEY=re_Gxm1DspJ_2X3eExo6XpuvtpoRpEE8oW36

# -------------------------------------------
# Aplicação
# -------------------------------------------
NEXT_PUBLIC_APP_URL=https://seu-dominio.bexp.com.br

# -------------------------------------------
# Administração
# -------------------------------------------
ADMIN_USERNAME=admin
ADMIN_PASSWORD=reuni0@2026

# Domínio permitido para emails de reserva
ALLOWED_EMAIL_DOMAIN=bexp.com.br
```

> **Importante**: Gere um `NEXTAUTH_SECRET` seguro:
> ```bash
> openssl rand -base64 32
> ```

## 6. Criação das Tabelas no MySQL

Execute a migration do Prisma para criar as tabelas:

```bash
npx prisma migrate deploy
```

Isso vai criar as seguintes tabelas com prefixo `reunio_`:
- `reunio_users`
- `reunio_accounts`
- `reunio_sessions`
- `reunio_verification_tokens`
- `reunio_branches`
- `reunio_rooms`
- `reunio_bookings`
- `reunio_cancellation_tokens`

## 7. Build da Aplicação

Gere a versão otimizada para produção:

```bash
npm run build
```

## 8. Execução com PM2

Inicie a aplicação em background:

```bash
pm2 start npm --name "reunio" -- start
```

Configure o PM2 para iniciar automaticamente no boot:

```bash
pm2 startup
# Copie e rode o comando (sudo) que o PM2 exibir
pm2 save
```

## 9. Configuração do Nginx (Proxy Reverso)

Crie um arquivo de configuração:

```bash
sudo nano /etc/nginx/sites-available/reunio
```

Conteúdo:

```nginx
server {
    listen 80;
    server_name reservas.bexp.com.br; # Seu domínio

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ative o site:

```bash
sudo ln -s /etc/nginx/sites-available/reunio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 10. Configuração de HTTPS (SSL Gratuito)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d reservas.bexp.com.br
```

---

## 📊 Dados Iniciais

Após o deploy, você precisa criar pelo menos uma filial e uma sala.

### Opção 1: Via Prisma Studio (Temporariamente)

```bash
npx prisma studio
```

Acesse `http://localhost:5555` e adicione:
1. Uma filial em `reunio_branches`
2. Uma sala em `reunio_rooms` vinculada à filial

### Opção 2: Via SQL direto no MySQL

```sql
-- Criar filial
INSERT INTO reunio_branches (id, name, location, timezone, is_active, created_at, updated_at) 
VALUES (UUID(), 'BEXP Matriz', 'São Paulo, SP', 'America/Sao_Paulo', 1, NOW(), NOW());

-- Criar sala (substitua o branch_id pelo ID gerado acima)
INSERT INTO reunio_rooms (id, branch_id, name, capacity, equipment_list, is_active, created_at, updated_at) 
VALUES (UUID(), 'ID_DA_FILIAL_AQUI', 'Sala de Reunião 1', 10, '[]', 1, NOW(), NOW());
```

---

## 🔄 Atualização

```bash
cd ~/apps/REUNI-O
git pull origin main
npm install
npx prisma migrate deploy
npm run build
pm2 restart reunio
```

## 🐛 Troubleshooting

```bash
# Ver logs da aplicação
pm2 logs reunio

# Ver status
pm2 status

# Testar conexão com MySQL
npx prisma db pull
```
