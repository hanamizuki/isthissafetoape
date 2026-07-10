import { Link, useLocation } from "react-router-dom"
import { Clock, Bell, LogIn, LogOut } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

/**
 * Shared site header used across all pages.
 * Renders the logo plus the auth controls: signed-out users get the free-tier
 * badge and a sign-in link; signed-in users get the plan badge and an avatar
 * menu (scan history / manage alerts / sign out). Owning the auth block here
 * keeps every page's header identical instead of each page composing its own.
 */
export function Header() {
  const { user, loading, signOut } = useAuth()
  const location = useLocation()

  // Google supplies avatar_url (sometimes picture); Apple supplies neither,
  // so the fallback initial comes from the display name or email.
  const meta = (user?.user_metadata ?? {}) as { avatar_url?: string; picture?: string; full_name?: string; name?: string }
  const avatarUrl = meta.avatar_url ?? meta.picture
  const initial = (meta.full_name ?? meta.name ?? user?.email ?? "?").charAt(0).toUpperCase()

  return (
    <>
      {/* Skip navigation link — visually hidden until focused */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-background focus:font-pixel focus:text-sm"
      >
        Skip to main content
      </a>
      {/* Opaque bg on mobile to skip backdrop-blur compositing; translucent + blur on desktop */}
      <header className="relative z-10 border-b-2 border-cyan-400/20 bg-background md:bg-background/90 md:backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <img src="/shield-logo.png" alt="" className="h-7 w-7 neon-drop-cyan" />
          <span className="font-pixel text-base sm:text-lg text-cyan-400 neon-text-cyan font-bold">
            IsThisSafeToApe
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {!loading && (
            user ? (
              <>
                <span className="hidden sm:inline-flex items-center h-11 px-3 border-2 border-muted-foreground/40 font-pixel-sm text-[10px] text-muted-foreground">
                  UNLIMITED
                </span>
                <DropdownMenu>
                  {/* Avatar opens the account menu — min 44×44 touch target via padding */}
                  <DropdownMenuTrigger
                    className="flex items-center justify-center min-w-[44px] min-h-[44px] outline-none"
                    aria-label="Account menu"
                  >
                    <Avatar className="h-8 w-8 rounded-none border-2 border-cyan-400/30">
                      <AvatarImage src={avatarUrl} alt="" />
                      <AvatarFallback className="rounded-none bg-cyan-500/10 font-pixel-sm text-[10px] text-cyan-400">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="rounded-none border-2 border-cyan-400/25 bg-card font-pixel-sm text-[10px]"
                  >
                    <DropdownMenuItem asChild className="min-h-[44px] rounded-none gap-2 cursor-pointer focus:bg-cyan-500/10 focus:text-cyan-400">
                      <Link to="/history">
                        <Clock className="h-3.5 w-3.5" />
                        SCAN HISTORY
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="min-h-[44px] rounded-none gap-2 cursor-pointer focus:bg-cyan-500/10 focus:text-cyan-400">
                      <Link to="/alerts">
                        <Bell className="h-3.5 w-3.5" />
                        MANAGE ALERTS
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        signOut().catch(() => toast.error("Couldn't sign out. Try again."))
                      }}
                      className="min-h-[44px] rounded-none gap-2 cursor-pointer focus:bg-cyan-500/10 focus:text-cyan-400"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      SIGN OUT
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <span className="hidden md:inline-flex items-center h-11 px-3 border-2 border-muted-foreground/40 font-pixel-sm text-[10px] text-muted-foreground">
                  FREE &middot; 3/DAY
                </span>
                <Link to={`/auth?redirect=${encodeURIComponent(location.pathname + location.search + location.hash)}`} aria-label="Sign in" className="inline-flex items-center gap-1.5 font-pixel-sm text-[10px] min-h-[44px] px-4 rounded-none border-2 border-cyan-400/30 text-cyan-400 hover:border-cyan-400/60 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors">
                  <LogIn className="h-3 w-3" />
                  <span className="hidden md:inline">SIGN IN</span>
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </header>
    </>
  )
}
