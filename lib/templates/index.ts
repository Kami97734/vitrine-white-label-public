export interface NicheTemplate {
  id: string
  name: string
  description: string
  emoji: string
  settings: {
    siteName: string
    siteTagline: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
    whatsappColor: string
    saleColor: string
    city: string
    addressLine: string
    hoursWeekdays: string
    hoursSaturday: string
    hoursSunday: string
    heroWhatsappText: string
    fabWhatsappText: string
    ctaPrimaryText: string
    ctaSecondaryText: string
    promoSectionTitle: string
    promoSectionSubtitle: string
    seoTitle: string
    seoDescription: string
  }
  categories: { title: string; slug: string }[]
  menuItems: { label: string; slugOrUrl: string; position?: string }[]
}

export const TEMPLATES: NicheTemplate[] = [
  {
    id: "embalagens",
    name: "Embalagens",
    description: "Embalagens, descartáveis e sacolas",
    emoji: "📦",
    settings: {
      siteName: "Demo Store",
      siteTagline: "Embalagens e descartáveis com o melhor preço para o seu negócio",
      primaryColor: "#0c87b8",
      secondaryColor: "#0f172a",
      accentColor: "#f97316",
      whatsappColor: "#22c55e",
      saleColor: "#f97316",
      city: "Sua cidade - UF",
      addressLine: "Rua Exemplo, 123 - Centro",
      hoursWeekdays: "Seg a Sex: 08:00 - 18:00",
      hoursSaturday: "Sáb: 08:00 - 12:00",
      hoursSunday: "Dom: fechado",
      heroWhatsappText: "Olá! Quero fazer um pedido. Vi o catálogo de embalagens e quero comprar.",
      fabWhatsappText: "Olá! Quero fazer um pedido ou tirar dúvidas sobre os produtos.",
      ctaPrimaryText: "Fazer pedido no WhatsApp",
      ctaSecondaryText: "Ver Produtos",
      promoSectionTitle: "Ofertas Imperdíveis",
      promoSectionSubtitle: "Aproveite nossos preços especiais",
      seoTitle: "Catálogo de Produtos | Vitrine White Label",
      seoDescription: "Embalagens e descartáveis com o melhor preço. Pratos, copos, sacolas, marmitex e muito mais.",
    },
    categories: [
      { title: "Copos", slug: "copos" },
      { title: "Pratos", slug: "pratos" },
      { title: "Sacolas", slug: "sacolas" },
      { title: "Marmitex", slug: "marmitex" },
      { title: "Descartáveis", slug: "descartaaveis" },
    ],
    menuItems: [
      { label: "Início", slugOrUrl: "/" },
      { label: "Copos", slugOrUrl: "copos" },
      { label: "Sacolas", slugOrUrl: "sacolas" },
      { label: "Ofertas", slugOrUrl: "#ofertas" },
    ],
  },
  {
    id: "moda",
    name: "Moda e Acessórios",
    description: "Roupas, calçados e acessórios",
    emoji: "👗",
    settings: {
      siteName: "Minha Moda",
      siteTagline: "Moda e acessórios com estilo para todas as ocasiões",
      primaryColor: "#d946ef",
      secondaryColor: "#1e1b4b",
      accentColor: "#f59e0b",
      whatsappColor: "#22c55e",
      saleColor: "#ef4444",
      city: "São Paulo - SP",
      addressLine: "Rua da Moda, 123 - Centro",
      hoursWeekdays: "Seg a Sex: 09:00 - 19:00",
      hoursSaturday: "Sáb: 09:00 - 14:00",
      hoursSunday: "Dom: fechado",
      heroWhatsappText: "Olá! Vi o catálogo de moda e quero comprar.",
      fabWhatsappText: "Olá! Quero saber mais sobre os produtos de moda.",
      ctaPrimaryText: "Comprar no WhatsApp",
      ctaSecondaryText: "Ver Lançamentos",
      promoSectionTitle: "Promoções da Semana",
      promoSectionSubtitle: "Aproveite descontos especiais",
      seoTitle: "Catálogo de Moda | Minha Moda",
      seoDescription: "Roupas, calçados e acessórios com estilo. Confira nosso catálogo completo.",
    },
    categories: [
      { title: "Feminino", slug: "feminino" },
      { title: "Masculino", slug: "masculino" },
      { title: "Acessórios", slug: "acessorios" },
      { title: "Calçados", slug: "calcados" },
    ],
    menuItems: [
      { label: "Início", slugOrUrl: "/" },
      { label: "Feminino", slugOrUrl: "feminino" },
      { label: "Masculino", slugOrUrl: "masculino" },
      { label: "Ofertas", slugOrUrl: "#ofertas" },
    ],
  },
  {
    id: "cosmeticos",
    name: "Cosméticos e Beleza",
    description: "Perfumes, maquiagem e cuidados pessoais",
    emoji: "💄",
    settings: {
      siteName: "Beleza Pura",
      siteTagline: "Cosméticos e beleza para realçar sua autoestima",
      primaryColor: "#ec4899",
      secondaryColor: "#831843",
      accentColor: "#a855f7",
      whatsappColor: "#22c55e",
      saleColor: "#f43f5e",
      city: "Rio de Janeiro - RJ",
      addressLine: "Av. Beleza, 456 - Copacabana",
      hoursWeekdays: "Seg a Sex: 09:00 - 20:00",
      hoursSaturday: "Sáb: 09:00 - 17:00",
      hoursSunday: "Dom: fechado",
      heroWhatsappText: "Olá! Vi o catálogo de cosméticos e quero comprar.",
      fabWhatsappText: "Olá! Quero saber mais sobre os produtos de beleza.",
      ctaPrimaryText: "Pedir no WhatsApp",
      ctaSecondaryText: "Ver Ofertas",
      promoSectionTitle: "Promoções de Beleza",
      promoSectionSubtitle: "Maquiagem e perfumes com preços imperdíveis",
      seoTitle: "Catálogo de Cosméticos | Beleza Pura",
      seoDescription: "Perfumes, maquiagem e cuidados pessoais. Confira nosso catálogo de cosméticos.",
    },
    categories: [
      { title: "Perfumes", slug: "perfumes" },
      { title: "Maquiagem", slug: "maquiagem" },
      { title: "Cabelos", slug: "cabelos" },
      { title: "Pele", slug: "pele" },
    ],
    menuItems: [
      { label: "Início", slugOrUrl: "/" },
      { label: "Perfumes", slugOrUrl: "perfumes" },
      { label: "Maquiagem", slugOrUrl: "maquiagem" },
      { label: "Ofertas", slugOrUrl: "#ofertas" },
    ],
  },
  {
    id: "pet-shop",
    name: "Pet Shop",
    description: "Rações, acessórios e cuidados para pets",
    emoji: "🐾",
    settings: {
      siteName: "Pet Amigo",
      siteTagline: "Tudo para seu pet com amor e cuidado",
      primaryColor: "#14b8a6",
      secondaryColor: "#0f172a",
      accentColor: "#f97316",
      whatsappColor: "#22c55e",
      saleColor: "#ef4444",
      city: "Belo Horizonte - MG",
      addressLine: "Rua dos Animais, 789 - Pampulha",
      hoursWeekdays: "Seg a Sex: 08:00 - 19:00",
      hoursSaturday: "Sáb: 08:00 - 14:00",
      hoursSunday: "Dom: 09:00 - 12:00",
      heroWhatsappText: "Olá! Vi o catálogo do Pet Amigo e quero comprar para meu pet.",
      fabWhatsappText: "Olá! Quero saber mais sobre os produtos para pets.",
      ctaPrimaryText: "Comprar no WhatsApp",
      ctaSecondaryText: "Ver Produtos",
      promoSectionTitle: "Ofertas para seu Pet",
      promoSectionSubtitle: "Rações e acessórios com preços especiais",
      seoTitle: "Catálogo Pet Shop | Pet Amigo",
      seoDescription: "Rações, acessórios e cuidados para seu pet. Confira nosso catálogo completo.",
    },
    categories: [
      { title: "Cães", slug: "caes" },
      { title: "Gatos", slug: "gatos" },
      { title: "Acessórios", slug: "acessorios" },
      { title: "Higiene", slug: "higiene" },
    ],
    menuItems: [
      { label: "Início", slugOrUrl: "/" },
      { label: "Cães", slugOrUrl: "caes" },
      { label: "Gatos", slugOrUrl: "gatos" },
      { label: "Ofertas", slugOrUrl: "#ofertas" },
    ],
  },
  {
    id: "alimentos",
    name: "Alimentos e Bebidas",
    description: "Produtos alimentícios, bebidas e guloseimas",
    emoji: "🍕",
    settings: {
      siteName: "Sabor & Cia",
      siteTagline: "Alimentos e bebidas com sabor e qualidade",
      primaryColor: "#e11d48",
      secondaryColor: "#1c1917",
      accentColor: "#f59e0b",
      whatsappColor: "#22c55e",
      saleColor: "#e11d48",
      city: "Curitiba - PR",
      addressLine: "Rua dos Sabores, 321 - Centro",
      hoursWeekdays: "Seg a Sex: 08:00 - 20:00",
      hoursSaturday: "Sáb: 08:00 - 18:00",
      hoursSunday: "Dom: 08:00 - 13:00",
      heroWhatsappText: "Olá! Vi o catálogo de alimentos e quero fazer um pedido.",
      fabWhatsappText: "Olá! Quero saber mais sobre os produtos alimentícios.",
      ctaPrimaryText: "Pedir agora",
      ctaSecondaryText: "Ver Cardápio",
      promoSectionTitle: "Ofertas do Dia",
      promoSectionSubtitle: "Aproveite nossas promoções imperdíveis",
      seoTitle: "Catálogo de Alimentos | Sabor & Cia",
      seoDescription: "Alimentos e bebidas com qualidade. Confira nosso catálogo completo.",
    },
    categories: [
      { title: "Bebidas", slug: "bebidas" },
      { title: "Congelados", slug: "congelados" },
      { title: "Doces", slug: "doces" },
      { title: "Salgados", slug: "salgados" },
    ],
    menuItems: [
      { label: "Início", slugOrUrl: "/" },
      { label: "Bebidas", slugOrUrl: "bebidas" },
      { label: "Doces", slugOrUrl: "doces" },
      { label: "Ofertas", slugOrUrl: "#ofertas" },
    ],
  },
  {
    id: "presentes",
    name: "Presentes e Souvenirs",
    description: "Presentes personalizados, lembranças e decoração",
    emoji: "🎁",
    settings: {
      siteName: "Mimo Perfeito",
      siteTagline: "Presentes que encantam para todas as ocasiões",
      primaryColor: "#a855f7",
      secondaryColor: "#1e1b4b",
      accentColor: "#f59e0b",
      whatsappColor: "#22c55e",
      saleColor: "#ef4444",
      city: "Porto Alegre - RS",
      addressLine: "Av. dos Presentes, 555 - Centro",
      hoursWeekdays: "Seg a Sex: 09:00 - 19:00",
      hoursSaturday: "Sáb: 09:00 - 18:00",
      hoursSunday: "Dom: fechado",
      heroWhatsappText: "Olá! Vi o catálogo de presentes e quero comprar um mimo.",
      fabWhatsappText: "Olá! Quero saber mais sobre os presentes e lembranças.",
      ctaPrimaryText: "Comprar Presente",
      ctaSecondaryText: "Ver Coleções",
      promoSectionTitle: "Coleções Especiais",
      promoSectionSubtitle: "Presentes para todas as ocasiões",
      seoTitle: "Catálogo de Presentes | Mimo Perfeito",
      seoDescription: "Presentes personalizados e lembranças para todas as ocasiões. Confira nosso catálogo.",
    },
    categories: [
      { title: "Aniversário", slug: "aniversario" },
      { title: "Natal", slug: "natal" },
      { title: "Personalizados", slug: "personalizados" },
      { title: "Decoração", slug: "decoracao" },
    ],
    menuItems: [
      { label: "Início", slugOrUrl: "/" },
      { label: "Aniversário", slugOrUrl: "aniversario" },
      { label: "Personalizados", slugOrUrl: "personalizados" },
      { label: "Ofertas", slugOrUrl: "#ofertas" },
    ],
  },
  {
    id: "festas",
    name: "Festas e Eventos",
    description: "Decoração, artigos para festas e eventos",
    emoji: "🎉",
    settings: {
      siteName: "Festa Total",
      siteTagline: "Tudo para sua festa em um só lugar",
      primaryColor: "#f43f5e",
      secondaryColor: "#1c1917",
      accentColor: "#f59e0b",
      whatsappColor: "#22c55e",
      saleColor: "#e11d48",
      city: "Salvador - BA",
      addressLine: "Rua da Alegria, 100 - Centro",
      hoursWeekdays: "Seg a Sex: 08:00 - 18:00",
      hoursSaturday: "Sáb: 08:00 - 13:00",
      hoursSunday: "Dom: fechado",
      heroWhatsappText: "Olá! Vi o catálogo de festas e quero decorar meu evento.",
      fabWhatsappText: "Olá! Quero saber mais sobre artigos para festas.",
      ctaPrimaryText: "Montar Festa",
      ctaSecondaryText: "Ver Decorações",
      promoSectionTitle: "Kits de Festa",
      promoSectionSubtitle: "Prepare sua festa com nossos kits completos",
      seoTitle: "Catálogo de Festas | Festa Total",
      seoDescription: "Artigos para festas, decoração e eventos. Confira nosso catálogo completo.",
    },
    categories: [
      { title: "Balões", slug: "baloes" },
      { title: "Decoração", slug: "decoracao" },
      { title: "Descartáveis", slug: "descartaaveis" },
      { title: "Kits", slug: "kits" },
    ],
    menuItems: [
      { label: "Início", slugOrUrl: "/" },
      { label: "Balões", slugOrUrl: "baloes" },
      { label: "Decoração", slugOrUrl: "decoracao" },
      { label: "Ofertas", slugOrUrl: "#ofertas" },
    ],
  },
]

export function getTemplateById(id: string): NicheTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
