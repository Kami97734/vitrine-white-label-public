"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Image as ImageIcon,
  Home,
  DollarSign,
  FileUp,
  Settings,
  LogOut,
  Flame,
  ListFilter,
  Menu,
  ShieldAlert,
  Images,
  ShoppingBag,
  Bot,
  Tags,
  TicketPercent,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useSettings } from "@/components/providers/settings-provider"
import { useLocale } from "@/components/providers/locale-provider"
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AdminSidebar() {
  const pathname = usePathname()
  const settings = useSettings()
  const { t } = useLocale()

  const sidebarSections = [
    {
      title: t("sidebar.overview"),
      items: [
        { href: "/admin", label: t("sidebar.dashboard"), icon: LayoutDashboard },
        { href: "/admin/health", label: t("sidebar.health"), icon: ShieldAlert },
      ],
    },
    {
      title: t("sidebar.catalog"),
      items: [
        { href: "/admin/products", label: t("sidebar.products"), icon: Package },
        { href: "/admin/categories", label: t("sidebar.categories"), icon: FolderTree },
        { href: "/admin/promo", label: t("sidebar.offers"), icon: Flame },
        { href: "/admin/orders", label: t("sidebar.orders"), icon: ShoppingBag },
      ],
    },
    {
      title: t("sidebar.showcase"),
      items: [
        { href: "/admin/banners", label: t("sidebar.banners"), icon: ImageIcon },
        { href: "/admin/home", label: t("sidebar.homeTexts"), icon: Home },
        { href: "/admin/menu", label: t("sidebar.menu"), icon: Menu },
      ],
    },
    {
      title: t("sidebar.tools"),
      items: [
        { href: "/admin/prices", label: t("sidebar.codePrices"), icon: DollarSign },
        { href: "/admin/prices/bulk", label: t("sidebar.bulkPrices"), icon: Tags },
        { href: "/admin/import", label: t("sidebar.import"), icon: FileUp },
        { href: "/admin/media", label: t("sidebar.media"), icon: Images },
      ],
    },
    {
      title: t("sidebar.system"),
      items: [
        { href: "/admin/settings", label: t("sidebar.settings"), icon: Settings },
        { href: "/admin/coupons", label: t("sidebar.coupons"), icon: TicketPercent },
        { href: "/admin/ai", label: t("sidebar.ai"), icon: Bot },
        { href: "/admin/logs", label: t("sidebar.logs"), icon: ListFilter },
      ],
    },
  ]

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    window.location.href = "/admin/login"
  }

  const hasLogo = settings.adminLogoUrl?.trim()

  return (
    <SidebarContent className="flex h-full flex-col">
      <SidebarHeader className="border-b border-border pb-3">
        <div className="flex items-center gap-2 px-2">
          {hasLogo && (
            <Image
              src={settings.adminLogoUrl}
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 rounded object-contain"
            />
          )}
          <span className="text-sm font-semibold text-foreground">
            {settings.adminPanelTitle || "Painel Admin"}
          </span>
        </div>
        <p className="px-2 text-xs text-muted-foreground">
          {settings.adminPanelSubtitle || "Gerencie catálogo, vitrine e configurações."}
        </p>
      </SidebarHeader>

      <nav className="flex-1 space-y-1 overflow-y-auto py-2">
        {sidebarSections.map((section) => (
          <SidebarGroup key={section.title} className="p-0 px-2">
            <SidebarGroupLabel className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {section.title}
            </SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => {
                const isActive =
                  item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} className={cn("justify-start gap-3")}>
                      <Link href={item.href}>
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </nav>

      <SidebarFooter className="border-t border-border">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              {t("sidebar.logout")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sair do painel</DialogTitle>
              <DialogDescription>Tem certeza que deseja sair?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleLogout}>Sair</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarFooter>
    </SidebarContent>
  )
}
