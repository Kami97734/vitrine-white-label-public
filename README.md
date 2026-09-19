# Vitrine Virtual White Label

> Versão pública para portfólio. Credenciais, banco de produção, uploads privados e configurações de deploy ficam fora deste repositório.

Base white label para criar vitrines virtuais configuráveis para diferentes empresas, com catálogo de produtos, painel administrativo, banners, temas e pedidos via WhatsApp.

## Rodando com Docker

1. Copie `.env.example` para `.env` e preencha, no mínimo, `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` e `ADMIN_JWT_SECRET`.
2. Gere a imagem e inicialize a aplicação:

```bash
docker compose up --build
```

3. Acesse `http://localhost:3000`.

O banco PostgreSQL é externo e deve ser fornecido por Supabase, Neon ou outro PostgreSQL gerenciado. O container não guarda segredos nem dados do banco na imagem.

Para executar apenas a imagem:

```bash
docker build -t vitrine-virtual-white-label .
docker run --env-file .env -p 3000:3000 vitrine-virtual-white-label
```

## Scripts

- `pnpm install`
- `pnpm dev`
- `pnpm exec next build`
- `pnpm exec next start`
- `pnpm exec tsc --noEmit`
- `pnpm exec eslint ./ --ext .js,.jsx,.ts,.tsx`

## Variáveis de ambiente

Copie o `.env.example` para `.env.local` e configure as variáveis locais. Nunca publique esse arquivo:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

Os valores presentes em `.env.example` são somente placeholders. Gere novos segredos para cada ambiente e nunca reutilize credenciais de produção.

## Segurança

- O repositório não contém `.env`, banco, logs, uploads privados ou tokens.
- O seed e os scripts administrativos exigem `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` definidos no ambiente.
- `ADMIN_JWT_SECRET` também é obrigatório; não existe segredo padrão para produção.

## White label

Cada instalação pode configurar nome, logo, cores, redes sociais, textos, SEO, banners e dados de contato pelo painel administrativo. Consulte [WHITELABEL_GUIDE.md](WHITELABEL_GUIDE.md) para o fluxo de personalização.

## Verificações locais

```bash
pnpm check
pnpm build
```
