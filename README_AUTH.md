# README_AUTH — Sistema de Autenticação

Documentação completa do sistema de autenticação da vitrine virtual.

---

## Visão Geral

O sistema tem **dois tipos de autenticação**:

| Tipo | Método | Rota |
|---|---|---|
| **Usuário comum** | Login com Google (OAuth) | `/login` |
| **Administrador** | E-mail + Código OTP (6 dígitos) | `/admin/login` |

---

## 1. Configurar Login com Google (Usuários)

### Passo a passo:

1. Acesse [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crie um projeto (ou use um existente)
3. Vá em **APIs e Serviços → Credenciais → Criar credenciais → ID do cliente OAuth**
4. Tipo: **Aplicativo da Web**
5. Em **Origens JavaScript autorizadas**: `http://localhost:3000`
6. Em **URIs de redirecionamento autorizados**: `http://localhost:3000/api/auth/callback/google`
7. Copie o **Client ID** e **Client Secret**
8. Coloque no `.env`:

```env
GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-seu-secret"
NEXTAUTH_SECRET="rode: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

> **Em produção**: adicione seu domínio real nas origens e URIs autorizados.

---

## 2. Configurar E-mail (SMTP Gmail) para Login ADM

O sistema envia o código OTP por e-mail usando **Nodemailer + Gmail SMTP** (gratuito).

### Criar senha de app no Gmail:

1. Acesse [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Selecione **App**: "Outro (nome personalizado)" → "Vitrine Admin"
3. Clique em **Gerar**
4. Copie a senha de 16 caracteres gerada
5. Coloque no `.env`:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu@gmail.com"
SMTP_PASS="abcd efgh ijkl mnop"   # senha de app (sem espaços)
SMTP_FROM="Nome da Loja <seu@gmail.com>"
```

> **Pré-requisito**: A conta Gmail deve ter autenticação em 2 fatores ativada.

---

## 3. Cadastrar um Administrador

O administrador precisa estar cadastrado na tabela `Admin` do banco.

### Via script (recomendado):

```bash
pnpm set-admin
```

Ou edite `prisma/set-admin.cjs` para usar seu e-mail e execute:

```bash
node prisma/set-admin.cjs
```

### Via seed inicial:

Configure no `.env`:
```env
SEED_ADMIN_EMAIL="admin@seudominio.com"
SEED_ADMIN_PASSWORD="qualquer-valor-ignorado-no-otp"
```

Depois execute:
```bash
pnpm db:seed
```

> **Nota**: O campo `passwordHash` existe no banco por compatibilidade, mas o login agora usa exclusivamente OTP por e-mail — a senha não é mais utilizada.

---

## 4. Testar Login ADM

1. Inicie o servidor: `pnpm dev`
2. Acesse [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
3. Digite o e-mail do administrador cadastrado
4. Clique em **Enviar código**
5. Verifique o terminal (em desenvolvimento, o código aparece nos logs do servidor se SMTP não estiver configurado)
6. Digite o código de 6 dígitos
7. Você será redirecionado para o painel

> **Sem SMTP configurado**: O código é impresso no log do servidor (apenas em desenvolvimento). Procure por `[admin:login-code]` nos logs.

---

## 5. Variáveis de Ambiente Completas

Crie um `.env` baseado no `.env.example`:

```env
# Banco de dados (SQLite local / PostgreSQL em produção)
DATABASE_URL="file:./prisma/dev.db"

# NextAuth (usuários comuns)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gere-com: openssl rand -base64 32"

# Google OAuth
GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-seu-secret"

# JWT do painel admin
ADMIN_JWT_SECRET="gere-com: openssl rand -base64 32"

# Seed do primeiro admin
SEED_ADMIN_EMAIL="admin@seudominio.com"
SEED_ADMIN_PASSWORD="ignorado-no-otp"

# SMTP para envio de código OTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu@gmail.com"
SMTP_PASS="senha-de-app-gmail"
SMTP_FROM="Loja <seu@gmail.com>"
```

---

## 6. Segurança Implementada

| Medida | Implementação |
|---|---|
| Código nunca em texto puro | Hash bcrypt no banco (`AdminOtpCode`) |
| Código expira | 10 minutos (`expiresAt`) |
| Código usado uma vez | `used = true` após verificação |
| Máx 5 tentativas por código | Campo `attempts` no banco |
| Rate limit por IP | 5 req / 15min (em memória) |
| Rate limit por e-mail | 3 envios / 10min (anti-spam) |
| Anti-enumeração | Mesma resposta para e-mail existe ou não |
| Cookie httpOnly + Secure | JWT do admin nunca acessível via JS |
| Proteção server-side | Middleware Next.js em `/admin/*` |
| Logs de auditoria | Tabela `AdminLog` com IP e ação |

---

## 7. Migração para Produção (Versão Paga/Profissional)

Quando precisar de mais escala ou recursos avançados:

### Envio de E-mail
| Serviço | Free Tier | Vantagem |
|---|---|---|
| **Resend** | 3.000/mês | Simples, API moderna |
| **Brevo** | 300/dia | Mais robusto |
| **SendGrid** | 100/dia | Grande reputação |
| **Amazon SES** | 62.000/mês (EC2) | Mais barato em escala |

### Autenticação
| Serviço | Vantagem |
|---|---|
| **Clerk** | OTP + MFA + UI pronto |
| **Auth0** | Completo, enterprise |
| **Supabase Auth** | Integrado ao banco, gratuito |
| **NextAuth v5** | Self-hosted, mais controle |

### Banco de Dados
- **PostgreSQL** (Supabase, Neon, Railway) — para produção real
- **Redis** (Upstash) — para rate limit distribuído e TTL de OTP

### Recursos Futuros
- [ ] 2FA real com TOTP (Google Authenticator) via `otplib`
- [ ] Logs de auditoria exportáveis
- [ ] Alerta por e-mail em login suspeito
- [ ] Sessões com refresh token
- [ ] IP allowlist para admin
- [ ] Domínio de e-mail próprio (melhora entregabilidade)

---

## 8. Estrutura dos Arquivos de Auth

```
lib/
  auth.ts                    → NextAuth (Google OAuth para usuários)
  admin-auth.ts              → JWT do admin (criar/verificar token)
  admin-login-store.ts       → Criar/verificar OTP no banco
  admin-log.ts               → Log de auditoria
  mail.ts                    → Envio de e-mail (Nodemailer)

middleware.ts                → Proteção server-side de /admin/*

app/
  login/page.tsx             → Tela de login Google (usuários)
  admin/login/page.tsx       → Tela de login OTP (admin, 2 etapas)
  api/admin/login/
    route.ts                 → POST: solicitar código OTP
    verify/route.ts          → POST: verificar código OTP
  api/admin/logout/route.ts  → POST: fazer logout (limpar cookie)
  api/auth/[...nextauth]/    → Handlers do NextAuth

prisma/schema.prisma
  model Admin { ... }        → Tabela de administradores
  model AdminOtpCode { ... } → Códigos OTP com hash e expiração
  model AdminLog { ... }     → Log de auditoria
```

---

*Última atualização: 2026-05*
