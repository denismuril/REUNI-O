# Guia de Instalação - REUNI-O

Este guia explica como configurar o ambiente de desenvolvimento local.

## Requisitos do Sistema

| Requisito | Versão Mínima |
|-----------|---------------|
| Node.js | 18.x ou superior |
| npm | 9.x ou superior |
| Git | 2.x |
| MySQL | 8.x |

## 1. Clone do Repositório

```bash
git clone https://github.com/denismuril/REUNI-O.git
cd REUNI-O
```

## 2. Instalação de Dependências

```bash
npm install
```

## 3. Configuração do Banco de Dados MySQL

### 3.1 Criar Banco de Dados

```sql
CREATE DATABASE reunio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'reunio_user'@'localhost' IDENTIFIED BY 'sua_senha_segura';
GRANT ALL PRIVILEGES ON reunio.* TO 'reunio_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3.2 Configurar Conexão

A conexão é feita via Prisma. Configure a URL no arquivo `.env.local`:

```env
DATABASE_URL="mysql://reunio_user:sua_senha_segura@localhost:3306/reunio"
```

### 3.3 Aplicar Migrações

```bash
# Gerar cliente Prisma
npx prisma generate

# Aplicar schema ao banco (desenvolvimento)
npx prisma db push

# OU criar migração formal (produção)
npx prisma migrate dev --name init
```

## 4. Configurar Resend (Email)

1. Acesse [resend.com](https://resend.com)
2. Crie uma conta
3. Vá em **API Keys** e crie uma chave
4. Copie a chave → `RESEND_API_KEY`
5. Verifique um domínio em **Domains** (ou use `onboarding@resend.dev` para testes)

> **Nota:** Sem `RESEND_API_KEY`, o sistema funciona normalmente mas os emails de confirmação, cancelamento e lembrete não são enviados.

## 5. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto (use `.env.example` como referência):

```env
# Banco de Dados
DATABASE_URL="mysql://user:password@host:3306/database"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL_INTERNAL=http://127.0.0.1:3000
NEXTAUTH_SECRET=gere_uma_chave_com_openssl_rand_base64_32

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000

# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxx
ALLOWED_EMAIL_DOMAIN=seudominio.com.br

# Cron Jobs (opcional)
CRON_SECRET=seu_segredo_cron_aqui
```

### Gerar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### Criar Primeiro Usuário Admin

O sistema não possui um usuário admin padrão. Para o primeiro acesso ao painel `/admin`, insira um registro diretamente no banco:

```sql
INSERT INTO reunio_users (id, email, password, full_name, role, created_at, updated_at)
VALUES (
    UUID(),
    'admin@seudominio.com.br',
    '$2a$12$...',   -- hash bcrypt da senha desejada
    'Administrador',
    'SUPERADMIN',
    NOW(),
    NOW()
);
```

Ou utilize o Prisma Studio:

```bash
npx prisma studio
```

Depois, crie novos admins diretamente pelo painel `/admin`.

## 6. Executar em Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em: **<http://localhost:3000>**

## 7. Build de Produção

```bash
npm run build
npm start
```

## Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (inclui `prisma generate`) |
| `npm start` | Iniciar produção |
| `npm run lint` | Verificar código |
| `npm run db:push` | Sincronizar schema com banco |
| `npm run db:migrate` | Criar migração de desenvolvimento |
| `npm run db:generate` | Regenerar cliente Prisma |
| `npm run db:studio` | Interface visual do banco (Prisma Studio) |

## Solução de Problemas

### Erro: "Cannot find module 'xyz'"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro de conexão com MySQL

1. Verifique se o MySQL está rodando
2. Confirme usuário/senha na `DATABASE_URL`
3. Verifique se o banco existe
4. Execute `npx prisma db push` novamente

### Erro no envio de email

1. Verifique a chave API do Resend
2. Confirme que o domínio está verificado
3. Para testes, use `onboarding@resend.dev` como remetente

### Erro de autenticação

1. Verifique se `NEXTAUTH_SECRET` está configurado
2. Confirme que `NEXTAUTH_URL` corresponde à URL de acesso
3. Em produção com Nginx, configure `NEXTAUTH_URL_INTERNAL=http://127.0.0.1:3000`
4. Reinicie o servidor após alterar variáveis
