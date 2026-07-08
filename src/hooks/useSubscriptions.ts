import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

// Per-protocol subscriptions for the logged-in user. The report-page bell reads `subscribed`
// (a Set of subscription keys) and calls `toggle` to follow/unfollow. The subscription key is
// the DeFiLlama slug when resolved, else the lowercased protocol name (see the migration).
// Anonymous users never reach `toggle` — the bell routes them to /auth first — so the query
// simply returns an empty set for them.
export function useSubscriptions() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return [] as string[]
      const { data, error } = await supabase
        .from("subscriptions")
        .select("protocol_slug")
        .eq("user_id", user.id)
      if (error) throw error
      // The browser client is untyped (createClient has no Database generic), so cast like useHistory.
      return (data as { protocol_slug: string }[]).map((r) => r.protocol_slug)
    },
  })

  const subscribed = new Set(data ?? [])

  const toggle = useMutation({
    mutationFn: async ({ key, name }: { key: string; name: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      if (subscribed.has(key)) {
        const { error } = await supabase
          .from("subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("protocol_slug", key)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("subscriptions")
          .insert({ user_id: user.id, protocol_slug: key, protocol_name: name })
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  })

  return { subscribed, toggle, isLoading }
}
