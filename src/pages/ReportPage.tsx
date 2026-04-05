import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useParams, Link } from "react-router-dom"
import { ArrowLeft, ExternalLink, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Copy, Check, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAnalyze } from "@/hooks/useAnalyze"
import { useScan } from "@/hooks/useScan"
import { toast } from "sonner"
import type { RiskReport, CategoryScore, RedFlag } from "@/types/risk"

function ReportPage() {
  const [searchParams] = useSearchParams()
  const { id: scanId } = useParams<{ id: string }>()
  const url = searchParams.get("url") || ""
  const analyze = useAnalyze()
  const scan = useScan(scanId)

  // Viewing a shared report by ID — no auth required
  const isSharedView = !!scanId

  useEffect(() => {
    if (isSharedView) return
    if (url && !analyze.data && !analyze.isPending && !analyze.isError) {
      analyze.mutate(url)
    }
  }, [url, analyze.data, analyze.isPending, analyze.isError, isSharedView]) // eslint-disable-line react-hooks/exhaustive-deps

  const report = isSharedView ? scan.data : analyze.data
  const isLoading = isSharedView ? scan.isLoading : analyze.isPending
  const isError = isSharedView ? scan.isError : analyze.isError
  const isRateLimited = !isSharedView && analyze.isError && (analyze.error?.message?.includes("limit") || false)
  const errorMessage = isSharedView
    ? (scan.error?.message || "Scan not found")
    : (analyze.error?.message || "Unknown error")
  const displayUrl = report?.projectUrl || url

  if (!isSharedView && !url) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center scanlines">
        <div className="text-center space-y-4">
          <p className="font-pixel text-sm text-muted-foreground">NO URL PROVIDED</p>
          <Link to="/"><Button variant="outline" className="font-pixel text-sm rounded-none border-2">GO BACK</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden scanlines">
      {/* Blur orb — hidden on mobile to reduce GPU compositing cost */}
      <div className="hidden md:block absolute top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <header className="relative z-10 border-b-2 border-cyan-500/20 bg-background md:bg-background/90 md:backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="" className="h-7 w-7 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
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
          <span className="font-pixel-sm text-[8px]">NEW SCAN</span>
        </Link>

        {displayUrl && (
          <div className="flex items-center gap-2 text-sm mb-8 border-2 border-cyan-500/15 bg-card/50 px-4 py-2.5">
            <span className="font-pixel-sm text-[7px] text-cyan-500/50">TARGET:</span>
            <span className="text-foreground truncate font-mono text-xs">{displayUrl}</span>
            <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="ml-auto shrink-0 text-muted-foreground hover:text-cyan-400 transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {isLoading && <LoadingSkeleton />}
        {isRateLimited && (
          <div className="border-2 border-yellow-500/25 bg-yellow-500/[0.03] p-6 text-center space-y-4">
            <p className="font-pixel text-sm text-yellow-400 neon-text-yellow">DAILY LIMIT REACHED</p>
            <p className="text-sm text-muted-foreground">You've used all 3 free scans for today. Sign in for unlimited access.</p>
            <Link to={`/auth?redirect=${encodeURIComponent(`/report?url=${encodeURIComponent(url)}`)}`}>
              <Button className="font-pixel text-sm rounded-none bg-cyan-500 hover:bg-cyan-400 text-background">
                <LogIn className="h-4 w-4 mr-2" />
                SIGN IN FOR UNLIMITED
              </Button>
            </Link>
          </div>
        )}
        {isError && !isRateLimited && (
          <div className="border-2 border-pink-500/25 bg-pink-500/[0.03] p-5 neon-box-pink text-center">
            <p className="font-pixel text-sm text-pink-400 neon-text-pink mb-2">SCAN FAILED</p>
            <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
            {!isSharedView && (
              <Button onClick={() => analyze.mutate(url)} className="font-pixel text-sm rounded-none bg-cyan-500 hover:bg-cyan-400 text-background">
                RETRY
              </Button>
            )}
          </div>
        )}
        {report && <ReportContent report={report} />}
      </main>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="w-20 h-20 bg-white/[0.04]" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48 bg-white/[0.04]" />
          <Skeleton className="h-4 w-24 bg-white/[0.04]" />
        </div>
      </div>
      <Skeleton className="h-24 w-full bg-white/[0.04]" />
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 bg-white/[0.04]" />)}
      </div>
      <div className="text-center mt-8">
        <span className="font-pixel text-sm text-cyan-400 neon-text-cyan animate-blink">
          SCANNING TARGET...
        </span>
        <p className="text-xs text-muted-foreground mt-2">AI is researching this project. This may take 10-20 seconds.</p>
      </div>
    </div>
  )
}

function ShareButtons({ report }: { report: RiskReport }) {
  const [copied, setCopied] = useState(false)

  if (!report.scanId) return null

  const shareUrl = `${window.location.origin}/report/${report.scanId}`
  const shareText = `${report.projectName}: ${report.totalScore}/100 (${report.riskLabel}) — AI risk assessment by IsThisSafeToApe`
  const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success("Link copied!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-pixel-sm text-[7px] text-muted-foreground/60 mr-1">SHARE:</span>
      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all text-cyan-400 text-xs"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        <span className="font-pixel-sm text-[7px]">{copied ? "COPIED" : "LINK"}</span>
      </button>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all text-cyan-400 text-xs"
      >
        <XIcon className="h-3 w-3" />
        <span className="font-pixel-sm text-[7px]">POST</span>
      </a>
    </div>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function ReportContent({ report }: { report: RiskReport }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-5">
          <PixelScoreGauge score={report.totalScore} maxScore={report.maxScore} riskLevel={report.riskLevel} />
          <div>
            <h1 className="font-pixel text-2xl sm:text-3xl font-bold text-white neon-text-cyan">{report.projectName}</h1>
            <RiskBadge level={report.riskLevel} label={report.riskLabel} />
          </div>
        </div>
        <div className="shrink-0 pt-1">
          <ShareButtons report={report} />
        </div>
      </div>

      <div className="border-2 border-cyan-500/15 bg-card/50 p-5 neon-box-cyan">
        <div className="font-pixel-sm text-[8px] text-cyan-400 tracking-wider mb-2">TL;DR</div>
        <p className="text-sm text-foreground leading-relaxed">{report.tldr}</p>
      </div>

      {report.redFlags && report.redFlags.length > 0 && (
        <div className="border-2 border-pink-500/25 bg-pink-500/[0.03] p-5 neon-box-pink">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-pink-400" />
            <span className="font-pixel text-sm font-bold text-pink-400 neon-text-pink">
              RED FLAGS ({report.redFlags.length})
            </span>
          </div>
          <div className="space-y-3">
            {report.redFlags.map((flag, i) => (
              <RedFlagItem key={i} flag={flag} />
            ))}
          </div>
        </div>
      )}

      {report.positives && report.positives.length > 0 && (
        <div className="border-2 border-emerald-500/25 bg-emerald-500/[0.03] p-5 neon-box-green">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="font-pixel text-sm font-bold text-emerald-400 neon-text-green">POSITIVE SIGNALS</span>
          </div>
          <ul className="space-y-1.5">
            {report.positives.map((p, i) => (
              <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5 shrink-0 font-pixel-sm text-[8px]">+</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.categories && (
        <div>
          <div className="font-pixel-sm text-[8px] text-muted-foreground tracking-widest mb-3">DETAILED BREAKDOWN</div>
          <div className="space-y-3">
            {report.categories.map((cat, i) => (
              <CategoryCard key={i} category={cat} />
            ))}
          </div>
        </div>
      )}

      <DeepDivePrompt report={report} />

      <div className="text-center font-pixel-sm text-[7px] text-muted-foreground/40 pt-4 pb-8 tracking-wider">
        SCAN COMPLETE {new Date(report.analyzedAt).toLocaleString()} &middot; AI-POWERED &middot; NFA
      </div>
    </div>
  )
}

function PixelScoreGauge({ score, maxScore, riskLevel }: { score: number; maxScore: number; riskLevel: string }) {
  const pct = (score / maxScore) * 100
  const totalSegments = 10
  const filledSegments = Math.round((pct / 100) * totalSegments)
  const color = riskLevel === "low" ? "#10b981" : riskLevel === "moderate" ? "#e8ff00" : riskLevel === "high" ? "#f97316" : "#ff2d78"
  const glowClass = riskLevel === "low" ? "neon-text-green" : riskLevel === "high" ? "neon-text-yellow" : ""

  return (
    <div className="shrink-0 flex flex-col items-center gap-1">
      <div className={`font-pixel text-4xl sm:text-5xl font-bold ${glowClass}`} style={{ color }}>{score}</div>
      <div className="flex gap-[2px]">
        {Array.from({ length: totalSegments }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-3"
            style={{ backgroundColor: i < filledSegments ? color : "rgba(255,255,255,0.06)" }}
          />
        ))}
      </div>
      <div className="font-pixel-sm text-[7px] text-muted-foreground">/{maxScore}</div>
    </div>
  )
}

function RiskBadge({ level, label }: { level: string; label: string }) {
  const styles: Record<string, string> = {
    "low": "border-emerald-400 text-emerald-400 neon-text-green",
    "moderate": "border-yellow-400 text-yellow-400 neon-text-yellow",
    "high": "border-orange-400 text-orange-400",
    "very-high": "border-pink-400 text-pink-400 neon-text-pink",
    "critical": "border-red-400 text-red-400 neon-text-pink",
  }
  return (
    <span className={`inline-block font-pixel-sm text-[8px] px-2 py-1 border-2 mt-2 tracking-widest ${styles[level] || styles["high"]}`}>
      {label}
    </span>
  )
}

function RedFlagItem({ flag }: { flag: RedFlag }) {
  const severityColors: Record<string, string> = {
    critical: "bg-pink-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
  }
  return (
    <div className="flex items-start gap-3">
      <div className={`w-2 h-2 mt-1.5 shrink-0 ${severityColors[flag.severity]}`} />
      <div>
        <div className="text-sm font-semibold text-foreground">{flag.title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{flag.description}</div>
      </div>
    </div>
  )
}

// Build a prompt from the report data so users can hand it to their own AI agent
// for deeper investigation. The prompt includes our analysis summary plus dynamic
// suggestions based on which categories scored low or had red flags.
function generateDeepDivePrompt(report: RiskReport): string {
  const lines: string[] = []
  // Default missing arrays — report is runtime JSON so fields may be absent
  const categories = report.categories ?? []
  const redFlags = report.redFlags ?? []
  const positives = report.positives ?? []

  // Section 1: Initial assessment summary
  lines.push(`I used IsThisSafeToApe.com to run an initial risk assessment on ${report.projectName} (${report.projectUrl}).`)
  lines.push("")
  lines.push("## Initial Assessment")
  lines.push("")
  lines.push(`- Overall Score: ${report.totalScore}/${report.maxScore} (${report.riskLabel})`)
  lines.push(`- Verdict: ${report.tldr}`)
  lines.push("")

  // Category scores
  lines.push("Category Scores:")
  for (const cat of categories) {
    lines.push(`- ${cat.name}: ${cat.score}/${cat.maxScore} — ${cat.summary}`)
  }
  lines.push("")

  // Red flags
  if (redFlags.length > 0) {
    lines.push("Red Flags:")
    for (const flag of redFlags) {
      lines.push(`- [${flag.severity.toUpperCase()}] ${flag.title}: ${flag.description}`)
    }
    lines.push("")
  }

  // Positives
  if (positives.length > 0) {
    lines.push("Positive Signals:")
    for (const p of positives) {
      lines.push(`- ${p}`)
    }
    lines.push("")
  }

  // Section 2: Dynamic deep-dive suggestions based on weak areas.
  // Use a Set to avoid duplicate suggestions when multiple categories match the same keyword.
  const suggestions = new Set<string>()

  for (const cat of categories) {
    const pct = cat.maxScore > 0 ? (cat.score / cat.maxScore) * 100 : 0
    const name = cat.name.toLowerCase()
    if (pct < 60) {
      if (name.includes("contract") || name.includes("security")) {
        suggestions.add("Smart Contract & Security scored low — look up audit reports, check for known vulnerabilities on this protocol, and verify multisig/timelock configurations.")
      } else if (name.includes("economic") || name.includes("financial")) {
        suggestions.add("Economic & Financial scored low — analyze the tokenomics, unlock schedule, liquidity depth, and whether the yield sources are sustainable.")
      } else if (name.includes("governance") || name.includes("transparency")) {
        suggestions.add("Governance & Transparency scored low — investigate governance proposal history, voting concentration, and how transparent the team is with financials.")
      } else if (name.includes("infrastructure")) {
        suggestions.add("Infrastructure Risk scored low — check oracle dependencies, bridge/cross-chain exposure, and frontend security posture.")
      } else if (name.includes("fundamental") || name.includes("project")) {
        suggestions.add("Project Fundamentals scored low — research the team background, track record, project milestones, and regulatory compliance status.")
      } else if (name.includes("market") || name.includes("operation")) {
        suggestions.add("Market & Operations scored low — evaluate market position relative to competitors, growth sustainability, and key partner dependencies.")
      }
    }
  }

  // Red flag specific suggestions
  const hasCritical = redFlags.some(f => f.severity === "critical")
  const hasHigh = redFlags.some(f => f.severity === "high")
  if (hasCritical || hasHigh) {
    suggestions.add("There are critical/high-severity red flags — verify each one against the latest on-chain data and project announcements to confirm they are still current.")
  }

  // Overall risk suggestion — use percentage so the threshold works regardless of maxScore
  const totalPct = report.maxScore > 0 ? (report.totalScore / report.maxScore) * 100 : 100
  if (totalPct < 40) {
    suggestions.add("The overall score is very low — consider researching safer alternatives in the same category and compare their risk profiles.")
  }

  // Fallback if no specific weak areas
  if (suggestions.size === 0) {
    suggestions.add("The initial assessment looks relatively positive — verify the key claims (audit status, team identity, TVL figures) are accurate and up to date.")
  }

  lines.push("## Suggested Deep-Dive Areas")
  lines.push("")
  for (const s of suggestions) {
    lines.push(`- ${s}`)
  }
  lines.push("")

  // Section 3: Action framework for the AI agent
  lines.push("## What I Need You To Do")
  lines.push("")
  lines.push("1. Verify the accuracy of this assessment — is any of the information outdated or incorrect?")
  lines.push("2. Investigate the deep-dive areas listed above in detail.")
  lines.push("3. Provide your independent risk evaluation — do you agree with the scoring? Are there risks not covered here?")
  lines.push("4. Give actionable recommendations — what should I watch out for if I decide to participate in this project?")

  return lines.join("\n")
}

// Copyable text box that renders the deep-dive prompt for users to take to their AI agent
function DeepDivePrompt({ report }: { report: RiskReport }) {
  const [copied, setCopied] = useState(false)
  const prompt = useMemo(() => generateDeepDivePrompt(report), [report])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      toast.success("Prompt copied!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  return (
    <div className="border-2 border-cyan-500/15 bg-card/50 p-5 neon-box-cyan">
      <div className="flex items-center justify-between mb-3">
        <div className="font-pixel-sm text-[8px] text-cyan-400 tracking-wider">
          TAKE THIS TO YOUR AI AGENT
        </div>
        <button
          onClick={handleCopy}
          aria-label={copied ? "Prompt copied to clipboard" : "Copy deep dive prompt to clipboard"}
          className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all text-cyan-400 text-xs"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span className="font-pixel-sm text-[7px]">{copied ? "COPIED" : "COPY PROMPT"}</span>
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Copy this prompt and paste it into your favorite AI assistant for a deeper, independent analysis.
      </p>
      <pre className="text-xs text-muted-foreground/80 bg-black/30 border border-white/[0.06] p-4 overflow-x-auto whitespace-pre-wrap break-words max-h-64 overflow-y-auto font-mono leading-relaxed" tabIndex={0} role="region" aria-label="Deep dive prompt text">
        {prompt}
      </pre>
    </div>
  )
}

function CategoryCard({ category }: { category: CategoryScore }) {
  const [expanded, setExpanded] = useState(false)
  const pct = (category.score / category.maxScore) * 100
  const totalSegments = 10
  const filledSegments = Math.round((pct / 100) * totalSegments)
  const color = pct >= 70 ? "#10b981" : pct >= 50 ? "#e8ff00" : pct >= 30 ? "#f97316" : "#ff2d78"

  return (
    <div className="border-2 border-white/[0.08] bg-white/[0.01] overflow-hidden hover:border-cyan-500/15 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="font-pixel-sm text-[8px] text-foreground tracking-wider">{category.name}</span>
            <span className="font-pixel text-sm text-foreground ml-2">
              {category.score}<span className="text-muted-foreground">/{category.maxScore}</span>
            </span>
          </div>
          <div className="flex gap-[2px] mb-2">
            {Array.from({ length: totalSegments }).map((_, i) => (
              <div
                key={i}
                className="h-2 flex-1 min-w-[4px]"
                style={{ backgroundColor: i < filledSegments ? color : "rgba(255,255,255,0.06)" }}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{category.summary}</p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t-2 border-white/[0.04]">
          <ul className="space-y-1.5 pt-3">
            {category.details.map((d, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-cyan-400 mt-px shrink-0 font-pixel-sm text-[8px]">&gt;</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default ReportPage
