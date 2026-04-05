import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Search, Shield, Eye, TrendingUp, Zap, AlertTriangle, Lock, LogIn, LogOut, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/Header"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { useRecentScans } from "@/hooks/useRecentScans"
import { getTimeAgo } from "@/lib/time"

function HomePage() {
  const [url, setUrl] = useState("")
  const navigate = useNavigate()
  const { user, loading: authLoading, signOut } = useAuth()
  const recentScans = useRecentScans()

  const handleAnalyze = () => {
    if (!url.trim()) {
      toast.error("Please enter a URL to analyze")
      return
    }
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`)
      navigate(`/report?url=${encodeURIComponent(parsed.toString())}`)
    } catch {
      toast.error("Please enter a valid URL")
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden scanlines">
      {/* Neon glow orbs — hidden on mobile to avoid GPU-heavy blur compositing */}
      <div className="hidden md:block absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="hidden md:block absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-emerald-500/8 blur-[100px] pointer-events-none" />

      <Header>
        {!authLoading && (
          user ? (
            <>
              <Link to="/history" className="flex items-center justify-center min-w-[44px] min-h-[44px] text-muted-foreground hover:text-cyan-400 transition-colors" title="Scan history" aria-label="Scan history">
                <Clock className="h-4 w-4" />
              </Link>
              <span className="font-pixel-sm text-[7px] text-emerald-400/70 bg-emerald-500/10 px-3 py-1.5 border-2 border-emerald-500/20 neon-box-green">
                UNLIMITED
              </span>
              <button
                onClick={() => signOut()}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] text-muted-foreground hover:text-cyan-400 transition-colors"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <span className="hidden md:inline font-pixel-sm text-[7px] text-cyan-400/70 bg-cyan-500/10 px-3 py-1.5 border-2 border-cyan-500/20">
                FREE &middot; 3/DAY
              </span>
              <Link to="/auth" className="inline-flex items-center gap-1.5 font-pixel-sm text-[8px] min-h-[44px] px-4 rounded-none border-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors">
                <LogIn className="h-3 w-3" />
                <span className="hidden md:inline">SIGN IN</span>
              </Link>
            </>
          )
        )}
      </Header>

      {/* Hero */}
      <main id="main-content" className="relative z-10 container mx-auto px-4 pt-16 sm:pt-20 pb-16 max-w-3xl">
        <div className="text-center space-y-5 mb-12">
          <h1 className="font-pixel text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Don&apos;t trust.
            <br />
            <span className="text-cyan-400 neon-text-cyan animate-neon-flicker">
              Verify.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Paste any DeFi project or airdrop URL. Our AI scans smart contracts, team credibility, tokenomics &amp; governance.
          </p>
        </div>

        {/* Search bar */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="flex gap-2 p-2 border-2 border-cyan-500/25 bg-card/50 backdrop-blur-sm neon-box-cyan">
            <Input
              placeholder="> enter_url..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              className="h-12 text-sm font-mono bg-transparent border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-cyan-500/30"
            />
            <Button
              size="lg"
              onClick={handleAnalyze}
              className="h-12 px-6 bg-cyan-500 hover:bg-cyan-400 text-background font-pixel font-bold text-sm rounded-none border-0 shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all duration-200"
            >
              <Search className="h-4 w-4 mr-2" />
              SCAN
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-3 justify-center">
            <div className="w-2 h-2 bg-emerald-400 animate-blink" />
            <span className="font-pixel-sm text-[7px] text-emerald-400/60">READY TO SCAN</span>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <FeatureCard
            icon={<Shield className="h-4 w-4" />}
            title="CONTRACT"
            description="Audit reports, code quality, centralization risks"
            color="cyan"
          />
          <FeatureCard
            icon={<Eye className="h-4 w-4" />}
            title="TRANSPARENCY"
            description="On-chain reserves, governance, team doxxing"
            color="emerald"
          />
          <FeatureCard
            icon={<TrendingUp className="h-4 w-4" />}
            title="FINANCIALS"
            description="Tokenomics, liquidity, yield sustainability"
            color="cyan"
          />
          <FeatureCard
            icon={<AlertTriangle className="h-4 w-4" />}
            title="RED FLAGS"
            description="Rug pull patterns, depeg, scam matching"
            color="pink"
          />
          <FeatureCard
            icon={<Zap className="h-4 w-4" />}
            title="INFRA"
            description="Oracle, bridge, MEV, frontend risks"
            color="emerald"
          />
          <FeatureCard
            icon={<Lock className="h-4 w-4" />}
            title="COMPLIANCE"
            description="Regulatory risk, KYC/AML, jurisdiction"
            color="cyan"
          />
        </div>

        {/* Recent Scans */}
        {recentScans.data && recentScans.data.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-cyan-400/60" />
              <span className="font-pixel text-sm text-cyan-400/80">Recent Scans</span>
            </div>
            <div className="space-y-2">
              {recentScans.data.map(scan => (
                <RecentScanRow key={scan.id} scan={scan} />
              ))}
            </div>
          </div>
        )}

        {/* Bottom */}
        <div className="text-center mt-14 font-pixel-sm text-[6px] text-muted-foreground/40 tracking-wider">
          POWERED BY AI &middot; NOT FINANCIAL ADVICE &middot; ALWAYS DYOR
        </div>
      </main>
    </div>
  )
}

function RecentScanRow({ scan }: { scan: { id: number; project_name: string | null; url_hostname: string; total_score: number | null; max_score: number | null; risk_level: string | null; created_at: string } }) {
  const navigate = useNavigate()
  const scoreColor = scan.risk_level === "low" ? "text-emerald-400"
    : scan.risk_level === "moderate" ? "text-yellow-400"
    : scan.risk_level === "high" ? "text-orange-400"
    : scan.risk_level ? "text-pink-400"
    : "text-muted-foreground"

  const timeAgo = getTimeAgo(scan.created_at, true)

  return (
    <button
      onClick={() => navigate(`/report/${scan.id}`)}
      className="w-full flex items-center gap-3 px-4 py-3 border-2 border-white/[0.06] bg-white/[0.01] hover:border-cyan-500/20 hover:bg-white/[0.02] transition-all text-left group"
    >
      {scan.total_score != null && (
        <span className={`font-pixel text-base font-bold shrink-0 w-10 text-center ${scoreColor}`}>
          {scan.total_score}
        </span>
      )}
      <span className="font-pixel text-xs text-white group-hover:text-cyan-400 transition-colors truncate flex-1">
        {scan.project_name || scan.url_hostname}
      </span>
      <span className="font-pixel-sm text-[6px] text-muted-foreground/40 shrink-0">{timeAgo}</span>
    </button>
  )
}


function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: "cyan" | "emerald" | "pink" }) {
  const colorMap = {
    cyan: {
      border: "border-cyan-500/15 hover:border-cyan-500/40",
      glow: "hover:shadow-[0_0_15px_rgba(34,211,238,0.1)]",
      icon: "text-cyan-400 border-cyan-500/30",
      title: "text-cyan-400",
    },
    emerald: {
      border: "border-emerald-500/15 hover:border-emerald-500/40",
      glow: "hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]",
      icon: "text-emerald-400 border-emerald-500/30",
      title: "text-emerald-400",
    },
    pink: {
      border: "border-pink-500/15 hover:border-pink-500/40",
      glow: "hover:shadow-[0_0_15px_rgba(255,45,120,0.1)]",
      icon: "text-pink-400 border-pink-500/30",
      title: "text-pink-400",
    },
  }
  const c = colorMap[color]

  return (
    <div className={`group border-2 bg-white/[0.01] p-4 transition-all duration-300 ${c.border} ${c.glow}`}>
      <div className={`w-8 h-8 border-2 flex items-center justify-center mb-3 ${c.icon}`}>
        {icon}
      </div>
      <h3 className={`font-pixel font-bold text-sm mb-2 ${c.title}`}>{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

export default HomePage
