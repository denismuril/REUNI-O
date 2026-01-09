# Guia de Instalação - REUNI-O

Este guia explica como configurar o ambiente de desenvolvimento local.

## Requisitos do Sistema

| Requisito | Versão Mínima |
|-----------|---------------|
| Node.js | 18.x ou superior |
| npm | 9.x ou superior |
| Git | 2.x |

## 1. Clone do Repositório

```bash
git clone https://github.com/seu-usuario/REUNI-O.git
cd REUNI-O
```

## 2. Instalação de Dependências

```bash
npm install
```

## 3. Configuração do Supabase

### 3.1 Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Clique em **New Project**
4. Preencha:
   - **Name**: `reuni-o` (ou nome desejado)
   - **Database Password**: Anote esta senha!
   - **Region**: Selecione a mais próxima

### 3.2 Criar Tabelas

Execute os seguintes SQLs no **SQL Editor** do Supabase:

#### Tabela: branches (Filiais)

```sql
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabela: rooms (Salas)

```sql
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    capacity INTEGER DEFAULT 10,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabela: bookings (Reservas)

```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    creator_name TEXT,
    creator_email TEXT,
    user_id UUID,
    status TEXT DEFAULT 'confirmed',
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabela: admin_deletion_logs (Logs de Exclusão)

```sql
CREATE TABLE admin_deletion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL,
    booking_title TEXT NOT NULL,
    booking_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    booking_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    room_name TEXT NOT NULL,
    creator_name TEXT,
    creator_email TEXT,
    deleted_by TEXT NOT NULL,
    deletion_reason TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### View: booking_details

```sql
CREATE OR REPLACE VIEW booking_details AS
SELECT 
    b.id,
    b.title,
    b.description,
    b.start_time,
    b.end_time,
    b.creator_name,
    b.creator_email,
    b.user_id,
    b.status,
    b.is_recurring,
    b.created_at,
    b.room_id,
    r.name AS room_name,
    r.color AS room_color,
    r.branch_id,
    br.name AS branch_name
FROM bookings b
JOIN rooms r ON b.room_id = r.id
JOIN branches br ON r.branch_id = br.id;
```

### 3.3 Habilitar RLS (Row Level Security)

```sql
-- Habilitar RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_deletion_logs ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (ajuste conforme necessário)
CREATE POLICY "Allow all for branches" ON branches FOR ALL USING (true);
CREATE POLICY "Allow all for rooms" ON rooms FOR ALL USING (true);
CREATE POLICY "Allow all for bookings" ON bookings FOR ALL USING (true);
CREATE POLICY "Allow all for admin_deletion_logs" ON admin_deletion_logs FOR ALL USING (true);
```

### 3.4 Obter Credenciais

1. No Supabase, vá em **Settings > API**
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Configurar Resend (Email)

1. Acesse [resend.com](https://resend.com)
2. Crie uma conta
3. Vá em **API Keys** e crie uma chave
4. Copie a chave → `RESEND_API_KEY`
5. Verifique um domínio em **Domains** (ou use `onboarding@resend.dev` para testes)

## 5. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

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
| `npm run build` | Build de produção |
| `npm start` | Iniciar produção |
| `npm run lint` | Verificar código |

## Solução de Problemas

### Erro: "Cannot find module 'xyz'"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro de conexão com Supabase

1. Verifique se as variáveis de ambiente estão corretas
2. Confirme que o projeto Supabase está ativo
3. Verifique se as tabelas foram criadas

### Erro no envio de email

1. Verifique a chave API do Resend
2. Confirme que o domínio está verificado
3. Para testes, use `onboarding@resend.dev` como remetente
