import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (isSignUp) {
        await signUp(email, password)
        toast.success("Account created! Check your email to confirm.")
      } else {
        await signIn(email, password)
        toast.success("Welcome back!")
        navigate(redirectTo)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden scanlines">
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-cyan-500/8 blur-[120px] pointer-events-none" />

      <main id="main-content" className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img src="/shield-logo.svg" alt="" className="h-10 w-10 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
          </Link>
          <h1 className="font-pixel text-xl text-cyan-400 neon-text-cyan mt-4">
            {isSignUp ? "Create Account" : "Sign In"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isSignUp ? "Sign up to start scanning DeFi projects" : "Sign in to continue scanning"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-2 border-cyan-500/15 bg-card/50 p-6 space-y-4 neon-box-cyan">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-pixel-sm text-[8px] text-cyan-400 tracking-wider">EMAIL</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 bg-transparent border-2 border-white/10 rounded-none font-mono text-sm focus-visible:ring-0 focus-visible:border-cyan-500/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-pixel-sm text-[8px] text-cyan-400 tracking-wider">PASSWORD</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-10 bg-transparent border-2 border-white/10 rounded-none font-mono text-sm focus-visible:ring-0 focus-visible:border-cyan-500/40"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-10 bg-cyan-500 hover:bg-cyan-400 text-background font-pixel font-bold text-sm rounded-none shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all disabled:opacity-50"
            >
              {submitting ? "..." : isSignUp ? "SIGN UP" : "SIGN IN"}
            </Button>
          </div>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-muted-foreground hover:text-cyan-400 transition-colors"
          >
            {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
          </button>
        </div>
      </main>
    </div>
  )
}

export default AuthPage
