# Guia de Deploy em Linux - REUNI-O

Este guia explica como fazer deploy do REUNI-O em um servidor Linux (Ubuntu 22.04 LTS).

## Requisitos do Servidor

| Requisito | Especificação |
|-----------|---------------|
| **OS** | Ubuntu 22.04 LTS |
| **RAM** | Mínimo 1GB (recomendado 2GB) |
| **CPU** | 1 vCPU |
| **Disco** | 20GB SSD |
| **Portas** | 22 (SSH), 80 (HTTP), 443 (HTTPS) |

## 1. Preparação do Servidor

### 1.1 Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Instalar Node.js (via NodeSource)

```bash
# Instalar curl se necessário
sudo apt install -y curl

# Adicionar repositório NodeSource (Node 20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar instalação
node --version  # Deve mostrar v20.x.x
npm --version   # Deve mostrar 10.x.x
```

### 1.3 Instalar PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 1.4 Instalar Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 1.5 Instalar Git

```bash
sudo apt install -y git
```

## 2. Configurar Aplicação

### 2.1 Criar Usuário de Aplicação

```bash
sudo useradd -m -s /bin/bash reuni
sudo passwd reuni
```

### 2.2 Clonar Repositório

```bash
sudo su - reuni
git clone https://github.com/seu-usuario/REUNI-O.git
cd REUNI-O
```

### 2.3 Instalar Dependências

```bash
npm install
```

### 2.4 Configurar Variáveis de Ambiente

```bash
nano .env.local
```

Adicione:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxx

# App
NEXT_PUBLIC_APP_URL=https://seu-dominio.com.br
```

### 2.5 Build de Produção

```bash
npm run build
```

## 3. Configurar PM2

### 3.1 Criar Arquivo de Configuração

```bash
nano ecosystem.config.js
```

Conteúdo:

```javascript
module.exports = {
  apps: [{
    name: 'reuni-o',
    script: 'npm',
    args: 'start',
    cwd: '/home/reuni/REUNI-O',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### 3.2 Iniciar Aplicação

```bash
pm2 start ecosystem.config.js
pm2 save
```

### 3.3 Configurar Inicialização Automática

```bash
# Sair do usuário reuni
exit

# Como root/sudo
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u reuni --hp /home/reuni
```

## 4. Configurar Nginx (Reverse Proxy)

### 4.1 Criar Configuração do Site

```bash
sudo nano /etc/nginx/sites-available/reuni-o
```

Conteúdo:

```nginx
server {
    listen 80;
    server_name seu-dominio.com.br www.seu-dominio.com.br;

    # Redirecionar para HTTPS (após configurar SSL)
    # return 301 https://$server_name$request_uri;

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
        proxy_read_timeout 86400;
    }
}
```

### 4.2 Ativar Site

```bash
sudo ln -s /etc/nginx/sites-available/reuni-o /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Configurar SSL/HTTPS (Let's Encrypt)

### 5.1 Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 Obter Certificado

```bash
sudo certbot --nginx -d seu-dominio.com.br -d www.seu-dominio.com.br
```

Siga as instruções:

1. Forneça um email válido
2. Aceite os termos de serviço
3. Escolha redirecionar HTTP para HTTPS (recomendado)

### 5.3 Renovação Automática

O Certbot configura renovação automática. Para testar:

```bash
sudo certbot renew --dry-run
```

## 6. Configurar Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

## 7. Comandos Úteis

### PM2

| Comando | Descrição |
|---------|-----------|
| `pm2 status` | Ver status da aplicação |
| `pm2 logs reuni-o` | Ver logs |
| `pm2 restart reuni-o` | Reiniciar aplicação |
| `pm2 stop reuni-o` | Parar aplicação |
| `pm2 monit` | Monitoramento em tempo real |

### Nginx

| Comando | Descrição |
|---------|-----------|
| `sudo nginx -t` | Testar configuração |
| `sudo systemctl reload nginx` | Recarregar config |
| `sudo systemctl restart nginx` | Reiniciar Nginx |
| `sudo tail -f /var/log/nginx/error.log` | Ver logs de erro |

## 8. Atualizar Aplicação

```bash
# Como usuário reuni
sudo su - reuni
cd REUNI-O

# Baixar atualizações
git pull origin main

# Reinstalar dependências (se necessário)
npm install

# Rebuild
npm run build

# Reiniciar
pm2 restart reuni-o
```

## 9. Backup

### 9.1 Script de Backup

```bash
#!/bin/bash
# /home/reuni/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/reuni/backups"

mkdir -p $BACKUP_DIR

# Backup do código (exceto node_modules)
tar -czf $BACKUP_DIR/reuni-o_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='.next' \
    /home/reuni/REUNI-O

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### 9.2 Agendar Backup (Cron)

```bash
crontab -e
```

Adicione:

```
0 2 * * * /home/reuni/backup.sh
```

## 10. Checklist de Deploy

- [ ] Servidor atualizado
- [ ] Node.js 20.x instalado
- [ ] PM2 instalado e configurado
- [ ] Nginx configurado como reverse proxy
- [ ] SSL/HTTPS ativo
- [ ] Firewall configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Build de produção executado
- [ ] Aplicação rodando via PM2
- [ ] DNS apontando para o servidor
- [ ] Backup configurado

## Solução de Problemas

### Aplicação não inicia

```bash
pm2 logs reuni-o --lines 50
```

### Erro 502 Bad Gateway

1. Verifique se a aplicação está rodando: `pm2 status`
2. Verifique a porta: `netstat -tlnp | grep 3000`
3. Verifique logs do Nginx: `sudo tail -f /var/log/nginx/error.log`

### Erro de permissão

```bash
sudo chown -R reuni:reuni /home/reuni/REUNI-O
```

### Memória insuficiente

Adicione swap:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```
