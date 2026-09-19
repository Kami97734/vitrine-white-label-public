import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-slate-900 dark:text-slate-100">404</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Página não encontrada
        </p>
        <p className="text-slate-500 dark:text-slate-500 max-w-md mx-auto">
          A página que você procura não existe ou foi removida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
