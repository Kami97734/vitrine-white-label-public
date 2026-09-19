# Guia White-Label: Customizando sua Vitrine

Este documento descreve como customizar a vitrine para sua marca usando o painel admin.

---

## 🎨 1. Branding Básico

### 1.1 Configurações gerais (`.env`)

Antes de iniciar, configure estas variáveis de ambiente:

```bash
# Banco de dados
DATABASE_URL="file:./prisma/prisma/dev.db"

# NextAuth (login por Google)
NEXTAUTH_SECRET="sua-chave-secreta-forte-aqui"
GOOGLE_CLIENT_ID="seu-id-aqui"
GOOGLE_CLIENT_SECRET="seu-secret-aqui"

# Admin JWT
ADMIN_JWT_SECRET="sua-chave-admin-forte-aqui"

# SMTP (para login OTP do admin)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-app"
SMTP_FROM="noreply@sua-empresa.com"
```

### 1.2 Customizar no painel admin

Acesse `/admin` e vá para **Configurações**.

**Logo e identidade:**
- Nome da empresa
- Slogan / tagline
- Logo (URL ou upload)
- Ícone do site (favicon)

**Cores e visual:**
- Cor primária (ex: `#0c87b8`)
- Cor secundária (ex: `#f97316`)
- Fonte padrão

**Contato:**
- E-mail de suporte
- Telefone/WhatsApp
- Endereço

**Configurações de entrega:**
- Aviso de frete
- Prazo de entrega
- Condições gerais

---

## 📱 2. Homepage

### 2.1 Hero Banner

Acesse `/admin/home` e edite:
- Título principal
- Subtítulo
- Imagem de fundo (ou vídeo)
- Botão de CTA (texto e link)

### 2.2 Seções dinâmicas

Na mesma página `/admin/home`, crie seções customizadas:
- Cards de benefício ("Frete grátis", "Qualidade garantida", etc)
- Blocos de texto com título + descrição
- Depoimentos de clientes

### 2.3 Banners rotativos

Acesse `/admin/banners` para:
- Criar banners para o carousel da homepage
- Definir ordem de exibição
- Ativar/desativar banners

---

## 🛍️ 3. Catálogo de Produtos

### 3.1 Adicionar produtos

Acesse `/admin/products`:

1. Clique em "Novo Produto"
2. Preencha:
   - Nome do produto
   - Descrição (suporta formatação)
   - SKU (código interno)
   - Imagens (múltiplas)
   - Categoria
   - Tags (para filtros)

3. Preços:
   - Preço base
   - Preço em promoção (deixar em branco se não houver desconto)

4. Status:
   - Ativo/Inativo
   - Destaque (aparece em promoções)

### 3.2 Categorias

Acesse `/admin/categories`:
- Criar categorias principais
- Criar subcategorias (hierarquia)
- Reordenar com drag-and-drop
- Ativar/desativar

### 3.3 Importar produtos via Excel

Acesse `/admin/import`:
- Baixar template Excel
- Preencher dados dos produtos
- Fazer upload do arquivo
- O sistema validará antes de importar

---

## 🎁 4. Promoções e Ofertas

### 4.1 Produtos em promoção

Acesse `/admin/promo`:
- Selecione produtos para promover
- Defina descontos
- Escolha período da promoção
- Ativar/desativar

### 4.2 Banner promocional

Acesse `/admin/banners` e crie um banner especial para promoções:
- Texto do desconto
- Imagem destacada
- Link para a seção de produtos

---

## 📊 5. Pedidos e Vendas

### 5.1 Ver pedidos

Acesse `/admin/orders`:
- Lista de pedidos recebidos
- Status (novo, em processamento, enviado, entregue)
- Detalhes do cliente
- Whatsapp / contato do cliente

### 5.2 Gerenciar pedidos

- Marcar como "processando"
- Marcar como "enviado"
- Adicionar rastreamento (opcional)

---

## 👤 6. Usuários Admin

### 6.1 Adicionar novo admin

Acesse `/admin/settings`:
- Opção para adicionar outro administrador
- Configure permissões (total ou restrito)

### 6.2 Login

- Insira seu e-mail
- Receba código OTP por e-mail
- Digite o código para entrar

---

## 📈 7. Monitorar a Vitrine

### 7.1 Status (Dashboard)

No painel principal, veja:
- ✅ Banco de dados: Online/Offline
- 📧 SMTP: Configurado/Não configurado
- ⚙️ Configurações: Completas/Incompletas
- 👥 Admins: Número de usuários

### 7.2 Logs de atividade

Acesse `/admin/logs`:
- Histórico de todas as ações no painel
- Quem fez o quê e quando
- Filtrar por tipo de ação ou admin

### 7.3 Health Check

Acesse `/admin/health`:
- Produtos sem preço
- Imagens faltando
- Categorias sem produtos
- Alertas de saúde do catálogo

---

## 🔒 8. Segurança

### 8.1 Trocar senha do admin

1. Acesse `/admin/settings`
2. Clique em "Alterar senha"
3. Insira a senha atual
4. Digite a nova senha (mínimo 8 caracteres)

### 8.2 Auditoria

Todos os acessos ao painel são registrados em `/admin/logs`. Verifique regularmente para detectar acessos suspeitos.

---

## 🚀 9. Deploy e Hospedagem

### 9.1 Fazer build

```bash
pnpm run build
```

### 9.2 Iniciar em produção

```bash
pnpm run start
```

### 9.3 Variáveis de ambiente em produção

Certifique-se que o `.env` inclui:
- `NODE_ENV=production`
- `NEXTAUTH_SECRET` forte (mínimo 32 caracteres)
- `ADMIN_JWT_SECRET` forte (mínimo 32 caracteres)
- `DATABASE_URL` apontando para banco de dados persistente (não SQLite em prod)
- `SMTP_*` com credenciais reais

---

## 📧 10. Integração WhatsApp

### 10.1 WhatsApp Business

A vitrine já inclui um botão flutuante do WhatsApp. Configure em **Configurações**:
- Seu número WhatsApp
- Mensagem padrão "Olá! Tenho interesse no produto..."

---

## 🆘 Troubleshooting

### "E-mail de OTP não chega"
- Verifique as credenciais SMTP em `.env`
- Teste se o SMTP está liberado (pode precisar de "Senha de app" no Gmail)
- Cheque a pasta de spam

### "Não consigo fazer upload de imagens"
- Verifique se a pasta `/public/uploads` existe e tem permissão de escrita
- Tente usar um formato menor (JPG em vez de PNG grande)

### "Dashboard lento"
- Verifique a quantidade de produtos no banco (limite recomendado: 5000)
- Se tiver muito, subdivida em mais categorias ou promova buscas por tags

---

## 📝 Dúvidas frequentes

**P: Posso mudar o domínio depois?**
R: Sim, a vitrine funciona em qualquer domínio. Apenas atualize as variáveis de ambiente e redeploy.

**P: Quantos produtos posso cadastrar?**
R: Sem limite técnico, mas recomendamos manter abaixo de 10.000 para performance.

**P: Preciso de backup?**
R: Sim! Faça backup regular do banco de dados (pasta `prisma/prisma/dev.db` se usar SQLite, ou backup do banco se usar PostgreSQL).

**P: Posso usar outro banco de dados (não SQLite)?**
R: Sim! Altere `DATABASE_URL` no `.env` para PostgreSQL, MySQL, ou outro suportado pelo Prisma.

---

## 🎯 Próximos passos

1. Customizar branding em **Configurações**
2. Importar catálogo de produtos em **Import**
3. Criar promoções em **Promo**
4. Testar a homepage em navegador incógnito
5. Configurar WhatsApp
6. Fazer deploy em produção

---

**Suporte:** Para dúvidas, entre em contato com seu desenvolvedor.
