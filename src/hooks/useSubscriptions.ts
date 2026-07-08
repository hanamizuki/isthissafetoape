import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

// Per-protocol subscriptions for the logged-in user. The report-page bell reads `subscribed`
// (a Set of subscription keys) and calls `toggle` to follow/unfollow. The subscription key is
// the DeFiLlama slug when resolved, else the lowercased protocol name (see the migration).
//
// `userId` comes from the caller (ReportContent resolves auth once and drills it down), so this
// hook makes no auth round-trip. Keying the query by userId keeps different users' subscriptions
// in separate caches — a freshly signed-in user never briefly sees the previous user's bells.
// Anonymous (userId undefined): the query is disabled and `subscribed` stays empty; the bell
// routes anonymous clicks to /auth before any toggle.
export function useSubscriptions(userId: string | undefined) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["subscriptions", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("protocol_slug")
        .eq("user_id", userId)
      if (error) throw error
      // The browser client is untyped (createClient has no Database generic), so cast like useHistory.
      return (data as { protocol_slug: string }[]).map((r) => r.protocol_slug)
    },
  })

  const subscribed = new Set(data ?? [])

  const toggle = useMutation({
    mutationFn: async ({ key, name }: { key: string; name: string }) => {
      if (!userId) throw new Error("Not authenticated")
      if (subscribed.has(key)) {
        const { error } = await supabase
          .from("subscriptions")
          .delete()
          .eq("user_id", userId)
          .eq("protocol_slug", key)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("subscriptions")
          .insert({ user_id: userId, protocol_slug: key, protocol_name: name })
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  })

  return { subscribed, toggle, isLoading }
}
