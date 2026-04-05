import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, ExternalLink, Clock, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/Header"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/useAuth"
import { useHistory } from "@/hooks/useHistory"
import type { ScanSummary } from "@/hooks/useHistory"
import { getTimeAgo } from "@/lib/time"

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
      <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <Header />

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

export default HistoryPage
