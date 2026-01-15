# Guia de Deploy em Servidor Linux (Ubuntu/Debian)

Este guia descreve os passos para hospedar a aplicação **REUNI-O** em um servidor Linux usando Node.js, PM2 e Nginx.

## 📋 Pré-requisitos

- Servidor Linux (Ubuntu 20.04 ou superior recomendado)
- Acesso SSH ao servidor
- Domínio configurado (opcional, mas recomendado)
- Projeto Supabase configurado (URL e Chaves)

## 1. Preparação do Servidor

Atualize o sistema e instale as dependências básicas:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx
```

## 2. Instalação do Node.js (via NVM)

Recomendamos usar o NVM para gerenciar versões do Node.js:

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

Instale o gerenciador de processos PM2:

```bash
npm install -g pm2
```

## 3. Configuração do Projeto

Clone o repositório no diretório desejado (geralmente `/var/www` ou `~/apps`):

```bash
mkdir -p ~/apps
cd ~/apps
git clone https://github.com/seu-git/REUNI-O.git
cd REUNI-O
```

Instale as dependências:

```bash
npm install
```

### Configuração de Variáveis de Ambiente

Crie o arquivo `.env.local` de produção:

```bash
nano .env.local
```

Cole o conteúdo (ajuste com seus dados reais):

```env
# Configurações do Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica-anon

# Email (Resend)
RESEND_API_KEY=re_sua_chave_resend
ALLOWED_EMAIL_DOMAIN=suaempresa.com.br

# URL da Aplicação (Importante para links de email)
NEXT_PUBLIC_APP_URL=https://reservas.suaempresa.com.br
```

## 4. Build da Aplicação

Gere a versão otimizada para produção:

```bash
npm run build
```

## 5. Execução com PM2

Inicie a aplicação em background:

```bash
pm2 start npm --name "reuniao-app" -- start
```

Configure o PM2 para iniciar automaticamente no boot:

```bash
pm2 startup
# Copie e rode o comando (sudo) que o PM2 exibir
pm2 save
```

## 6. Configuração do Nginx (Proxy Reverso)

O Nginx vai receber as requisições na porta 80/443 e repassar para o Next.js na porta 3000.

Crie um arquivo de configuração:

```bash
sudo nano /etc/nginx/sites-available/reuniao
```

Conteúdo recomendado:

```nginx
server {
    listen 80;
    server_name reservas.suaempresa.com.br; # Seu domínio ou IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ative o site e reinicie o Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/reuniao /etc/nginx/sites-enabled/
sudo nginx -t # Testa configuração
sudo systemctl restart nginx
```

## 7. Configuração de HTTPS (SSL Gratuito)

Se você tiver um domínio, use o Certbot para ativar HTTPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d reservas.suaempresa.com.br
```

---

## 🔄 Atualização (Deploy Contínuo Manual)

Para atualizar a aplicação quando houver novidades no Git:

```bash
cd ~/apps/REUNI-O
git pull origin main
npm install
npm run build
pm2 restart reuniao-app
```

## 🐛 Troubleshooting

Ver logs da aplicação:

```bash
pm2 logs reuniao-app
```

Ver status do serviço:

```bash
pm2 status
```
