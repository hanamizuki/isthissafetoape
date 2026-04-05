import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, ExternalLink, Clock, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/useAuth"
import { useHistory } from "@/hooks/useHistory"
import type { ScanSummary } from "@/hooks/useHistory"

function HistoryPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const history = useHistory()

  if (authLoading) {
    return (
      <PageShell>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full bg-white/[0.04]" />)}
        </div>
      </PageShell>
    )
  }

  if (!user) {
    return (
      <PageShell>
        <div className="border-2 border-cyan-500/15 bg-card/50 p-8 neon-box-cyan text-center">
          <p className="font-pixel text-sm text-cyan-400 neon-text-cyan mb-2">SIGN IN REQUIRED</p>
          <p className="text-sm text-muted-foreground mb-4">Sign in to view your scan history.</p>
          <Link to={`/auth?redirect=${encodeURIComponent("/history")}`}>
            <Button className="font-pixel text-sm rounded-none bg-cyan-500 hover:bg-cyan-400 text-background">
              SIGN IN
            </Button>
          </Link>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      {history.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full bg-white/[0.04]" />)}
        </div>
      )}

      {history.isError && (
        <div className="border-2 border-pink-500/25 bg-pink-500/[0.03] p-5 neon-box-pink text-center">
          <p className="font-pixel text-sm text-pink-400 neon-text-pink mb-2">LOAD FAILED</p>
          <p className="text-sm text-muted-foreground">{history.error?.message}</p>
        </div>
      )}

      {history.data && history.data.length === 0 && (
        <div className="border-2 border-cyan-500/15 bg-card/50 p-8 neon-box-cyan text-center">
          <Search className="h-8 w-8 text-cyan-400/40 mx-auto mb-3" />
          <p className="font-pixel text-sm text-cyan-400 neon-text-cyan mb-2">NO SCANS YET</p>
          <p className="text-sm text-muted-foreground mb-4">Scan a DeFi project to see it here.</p>
          <Link to="/">
            <Button className="font-pixel text-sm rounded-none bg-cyan-500 hover:bg-cyan-400 text-background">
              START SCANNING
            </Button>
          </Link>
        </div>
      )}

      {history.data && history.data.length > 0 && (
        <div className="space-y-3">
          {history.data.map(scan => (
            <ScanCard key={scan.id} scan={scan} onClick={() => navigate(`/report/${scan.id}`)} />
          ))}
        </div>
      )}
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden scanlines">
      {/* Blur orb — hidden on mobile to reduce GPU compositing cost */}
      <div className="hidden md:block absolute top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <header className="relative z-10 border-b-2 border-cyan-500/20 bg-background md:bg-background/90 md:backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src="/shield-logo.svg" alt="" className="h-7 w-7 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            <span className="font-pixel text-base sm:text-lg text-cyan-400 neon-text-cyan font-bold">
              IsThisSafeToApe
            </span>
          </Link>
          <a href="https://github.com/hanamizuki/isthissafetoape" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-cyan-400 transition-colors" title="View source on GitHub">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-cyan-400 transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span className="font-pixel-sm text-[8px]">HOME</span>
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <Clock className="h-5 w-5 text-cyan-400" />
          <h1 className="font-pixel text-xl sm:text-2xl text-white neon-text-cyan">Scan History</h1>
        </div>

        {children}
      </main>
    </div>
  )
}

function ScanCard({ scan, onClick }: { scan: ScanSummary; onClick: () => void }) {
  const riskColors: Record<string, string> = {
    low: "text-emerald-400 border-emerald-400/30",
    moderate: "text-yellow-400 border-yellow-400/30",
    high: "text-orange-400 border-orange-400/30",
    "very-high": "text-pink-400 border-pink-400/30",
    critical: "text-red-400 border-red-400/30",
  }
  const scoreColor = scan.risk_level
    ? (riskColors[scan.risk_level] || "text-foreground border-white/10")
    : "text-foreground border-white/10"

  const timeAgo = getTimeAgo(scan.created_at)

  return (
    <button
      onClick={onClick}
      className="w-full text-left border-2 border-white/[0.08] bg-white/[0.01] p-4 hover:border-cyan-500/25 hover:bg-white/[0.02] transition-all group"
    >
      <div className="flex items-start gap-4">
        {scan.total_score != null && (
          <div className={`shrink-0 w-14 h-14 border-2 flex flex-col items-center justify-center ${scoreColor}`}>
            <span className="font-pixel text-lg font-bold">{scan.total_score}</span>
            <span className="font-pixel-sm text-[6px] opacity-60">/{scan.max_score}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-pixel text-sm text-white group-hover:text-cyan-400 transition-colors truncate">
              {scan.project_name || scan.url_hostname}
            </span>
            {scan.risk_label && (
              <span className={`font-pixel-sm text-[7px] px-1.5 py-0.5 border shrink-0 ${scoreColor}`}>
                {scan.risk_label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <span className="font-mono truncate">{scan.url_hostname}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
          </div>
          {scan.tldr && (
            <p className="text-xs text-muted-foreground/70 line-clamp-2">{scan.tldr}</p>
          )}
          <div className="text-[10px] text-muted-foreground/40 mt-2 font-pixel-sm">{timeAgo}</div>
        </div>
      </div>
    </button>
  )
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "JUST NOW"
  if (mins < 60) return `${mins}M AGO`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}H AGO`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}D AGO`
  return new Date(dateStr).toLocaleDateString()
}

export default HistoryPage
