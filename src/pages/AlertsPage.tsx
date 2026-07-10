import { Link } from "react-router-dom"
import { Bell, BellOff } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/PageShell"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/useAuth"
import { useSubscriptionList } from "@/hooks/useSubscriptions"
import type { SubscriptionRow } from "@/hooks/useSubscriptions"
import { getTimeAgo } from "@/lib/time"

/**
 * Manage Alerts: every protocol the signed-in user follows for security-alert
 * emails, with one-click unfollow. Follows are created from the report page bell.
 */
function AlertsPage() {
  const { user, loading: authLoading } = useAuth()
  const subs = useSubscriptionList(user?.id)

  const shell = (children: React.ReactNode) => (
    <PageShell title="Manage Alerts" icon={<Bell className="h-5 w-5 text-cyan-400" />}>
      {children}
    </PageShell>
  )

  if (authLoading || (user && subs.isLoading)) {
    return shell(
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full bg-white/[0.04]" />)}
      </div>
    )
  }

  if (!user) {
    return shell(
      <div className="border-2 border-cyan-400/15 bg-card/50 p-8 neon-box-cyan text-center">
        <p className="font-pixel text-sm text-cyan-400 neon-text-cyan mb-2">SIGN IN REQUIRED</p>
        <p className="text-sm text-muted-foreground mb-4">Sign in to manage your security alerts.</p>
        <Link to={`/auth?redirect=${encodeURIComponent("/alerts")}`}>
          <Button className="font-pixel text-sm rounded-none bg-cyan-500 hover:bg-cyan-400 text-background">
            SIGN IN
          </Button>
        </Link>
      </div>
    )
  }

  if (subs.isError) {
    return shell(
      <div className="border-2 border-pink-500/25 bg-pink-500/[0.03] p-5 neon-box-pink text-center">
        <p className="font-pixel text-sm text-pink-400 neon-text-pink mb-2">LOAD FAILED</p>
        <p className="text-sm text-muted-foreground">{subs.error?.message}</p>
      </div>
    )
  }

  if (!subs.data || subs.data.length === 0) {
    return shell(
      <div className="border-2 border-cyan-400/15 bg-card/50 p-8 neon-box-cyan text-center">
        <Bell className="h-8 w-8 text-cyan-400/40 mx-auto mb-3" />
        <p className="font-pixel text-sm text-cyan-400 neon-text-cyan mb-2">NO ALERTS YET</p>
        <p className="text-sm text-muted-foreground mb-4">
          Follow a protocol from any report to get security alerts here.
        </p>
        <Link to="/">
          <Button className="font-pixel text-sm rounded-none bg-cyan-500 hover:bg-cyan-400 text-background">
            START SCANNING
          </Button>
        </Link>
      </div>
    )
  }

  return shell(
    <div className="space-y-3">
      {subs.data.map(sub => (
        <AlertRow
          key={sub.protocol_slug}
          sub={sub}
          unfollowing={subs.unsubscribe.isPending && subs.unsubscribe.variables === sub.protocol_slug}
          onUnfollow={() => subs.unsubscribe.mutate(sub.protocol_slug, {
            onError: () => toast.error(`Couldn't stop alerts for ${sub.protocol_name}. Try again.`),
          })}
        />
      ))}
    </div>
  )
}

function AlertRow({ sub, unfollowing, onUnfollow }: {
  sub: SubscriptionRow
  unfollowing: boolean
  onUnfollow: () => void
}) {
  return (
    <div className="flex items-center gap-4 border-2 border-white/[0.08] bg-white/[0.01] p-4">
      <Bell className="h-4 w-4 text-emerald-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{sub.protocol_name}</p>
        <p className="text-xs text-muted-foreground">Alerts on &middot; followed {getTimeAgo(sub.created_at).toLowerCase()}</p>
      </div>
      <button
        onClick={onUnfollow}
        disabled={unfollowing}
        className="flex items-center gap-1.5 min-h-[44px] px-3 font-pixel-sm text-[10px] text-muted-foreground border-2 border-white/10 hover:border-pink-500/40 hover:text-pink-400 transition-colors disabled:opacity-50 shrink-0"
        title={`Stop alerts for ${sub.protocol_name}`}
        aria-label={`Stop alerts for ${sub.protocol_name}`}
      >
        <BellOff className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">UNFOLLOW</span>
      </button>
    </div>
  )
}

export default AlertsPage
