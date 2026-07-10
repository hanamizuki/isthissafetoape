import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

/**
 * Shared scaffold for secondary pages (scan history, manage alerts):
 * background orb, header, back-to-home link, page title, content, footer.
 */
export function PageShell({ title, icon, children }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden scanlines">
      {/* Blur orb — hidden on mobile to reduce GPU compositing cost */}
      <div className="hidden md:block absolute top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <Header />

      <main id="main-content" className="relative z-10 container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 min-h-[44px] text-sm text-muted-foreground hover:text-cyan-400 transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span className="font-pixel-sm text-[10px]">HOME</span>
        </Link>

        <div className="flex items-center gap-3 mb-6">
          {icon}
          <h1 className="font-pixel text-xl sm:text-2xl text-white neon-text-cyan">{title}</h1>
        </div>

        {children}

        <Footer />
      </main>
    </div>
  )
}
