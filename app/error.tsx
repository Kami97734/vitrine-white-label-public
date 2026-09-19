"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-slate-900">500</h1>
        <p className="text-xl text-slate-600">Erro interno do servidor</p>
        <p className="text-slate-500 max-w-md mx-auto text-sm">
          Algo deu errado. Tente novamente ou volte para a página inicial.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  )
}