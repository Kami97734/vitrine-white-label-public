# GUIA DE DEPLOY — Vercel + Supabase

## 1. CRIAR BANCO NO SUPABASE

1. Acesse https://supabase.com e faça login
2. Clique em **"New project"**
3. Preencha:
   - **Name**: `product-catalog-db`
   - **Database Password**: gere uma senha forte (anote!)
   - **Region**: escolha a mais próxima (ex: South America - São Paulo)
4. Aguarde ~2 min até o banco ficar pronto
5. Vá em **Project Settings → Database → Connection string**
   - Copie a **URI** (connection string) no formato:
     ```
     postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres
     ```
   - Substitua `[PASSWORD]` pela senha que você criou

## 2. PREPARAR O PROJETO

### Migrar schema para PostgreSQL

```bash
# No terminal do projeto (PowerShell):
cd "<project-root>"

# Instalar dependências
pnpm install

# Gerar Prisma Client
npx prisma generate
```

### Configurar variáveis de ambiente

Crie um arquivo `.env.production` (não versionar) ou configure direto no Vercel:

```
# Banco PostgreSQL (substitua pela sua connection string do Supabase)
DATABASE_URL="postgresql://postgres:SUA_SENHA@host.supabase.co:6543/postgres"

# NextAuth
NEXTAUTH_URL="https://seu-app.vercel.app"
NEXTAUTH_SECRET="gere-um-secret-aqui"

# Admin JWT
ADMIN_JWT_SECRET="outro-secret-forte-aqui"

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# SMTP (obrigatório p/ login admin)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"
SMTP_FROM="Seu Site <seu-email@gmail.com>"

# Upload (local não funciona no Vercel - use Cloudinary)
UPLOAD_PROVIDER="local"

# IA (opcional)
GROQ_API_KEY=""

# Desliga rate-limit em memória no serverless
RATE_LIMIT_MEMORY="true"
```

### Migrar o banco

```bash
# Aplica o schema no PostgreSQL do Supabase
set DATABASE_URL="postgresql://postgres:SUA_SENHA@host.supabase.co:6543/postgres"
npx prisma db push
```

> **Importante**: A migration apaga dados se a tabela `SiteSettings` não tiver a coluna `language`.  
> Se já existir banco local SQLite com dados, use `npx prisma db push --accept-data-loss`

### Criar admin inicial

```bash
npx ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts
```

Ou manualmente:

```bash
npx ts-node --compiler-options {"module":"CommonJS"} prisma/set-admin.ts
```

## 3. CONFIGURAR UPLOAD (Cloudinary)

Upload local (`public/uploads/`) **NÃO funciona no Vercel** (sem filesystem).

### Opção gratuita: Cloudinary

1. Crie conta em https://cloudinary.com
2. Vá em Dashboard e copie:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. No Vercel, adicione as env vars:
   ```
   UPLOAD_PROVIDER=cloudinary
   CLOUDINARY_CLOUD_NAME=seu-cloud-name
   CLOUDINARY_API_KEY=sua-api-key
   CLOUDINARY_API_SECRET=seu-api-secret
   ```

### Alternativas: Uploadthing, AWS S3, Cloudflare R2

Edite `app/api/upload/route.ts` para adicionar o provider desejado.

## 4. FAZER DEPLOY NO VERCEL

### Via CLI (recomendado)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Logar
vercel login

# Deploy (a partir da pasta do projeto)
cd "<project-root>"
vercel --prod
```

### Via GitHub (alternativa)

1. Crie um repositório no GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/seu-user/product-catalog.git
   git push -u origin main
   ```
2. Acesse https://vercel.com/new
3. Importe o repositório
4. Configure as variáveis de ambiente (todas do `.env.production`)
5. Clique em **Deploy**

### Configurar env vars no Vercel

No dashboard do Vercel:
1. Vá em **Seu Projeto → Settings → Environment Variables**
2. Adicione **TODAS** as variáveis do `.env.production`
3. Destaque: `DATABASE_URL`, `NEXTAUTH_SECRET`, `ADMIN_JWT_SECRET`, `NEXTAUTH_URL`

> `NEXTAUTH_URL` deve ser a URL do seu deploy: `https://seu-app.vercel.app`

## 5. PÓS-DEPLOY

### Primeiro acesso admin

1. Acesse `https://seu-app.vercel.app/admin/login`
2. Digite o e-mail do admin configurado no seed
3. Verifique o código OTP no e-mail configurado no SMTP
4. Complete o setup inicial (nome, template, WhatsApp)

### Verificar status

No painel admin, o card **"Status da Vitrine"** mostra:
- ✅ Banco conectado
- ✅ SMTP configurado
- ⚠️ Upload local vai mostrar erro (precisa Cloudinary)

### Cron job (opcional)

O `vercel.json` inclui um cron para limpar OTPs expirados:
```
/api/cron/cleanup-otp a cada 6h
```

Crie o arquivo `app/api/cron/cleanup-otp/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { cleanExpiredOtpCodes } from "@/lib/admin-login-store"

export async function GET() {
  await cleanExpiredOtpCodes()
  return NextResponse.json({ ok: true })
}
```

## 6. TESTAR COM TESTSPRITE

```bash
# Instalar testsprite
npm install -g testsprite

# Testar o site
testsprite https://seu-app.vercel.app
```

Ou use o Lighthouse do Chrome para auditoria básica.

---

## SOLUÇÃO DE PROBLEMAS

| Problema | Causa | Solução |
|----------|-------|---------|
| `Middleware not found` | proxy.ts faltando | Verificar se `proxy.ts` existe na raiz |
| `Prisma: column not found` | Schema desatualizado | Rodar `prisma db push` com a DATABASE_URL certa |
| Upload retorna 500 | Provider não configurado | Setar `UPLOAD_PROVIDER=cloudinary` ou deixar `local` em dev |
| Login OTP não chega | SMTP inválido | Verificar SMTP_HOST/USER/PASS no Vercel |
| 404 em `/carrinho` | Página removida | OK - carrinho usa drawer lateral |
| Build falha no Vercel | Tailwind v3/v4 conflito | Já corrigido (v4 removido) |
| `admin_token` não seta | HTTPS necessário | Cookie `Secure` só funciona em produção Vercel |
