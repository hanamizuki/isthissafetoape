import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { ScanSummary } from "@/hooks/useHistory"

export function useRecentScans() {
  return useQuery({
    queryKey: ["recent-scans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scans")
        .select("id, url, url_hostname, project_name, total_score, max_score, risk_level, risk_label, tldr, created_at")
        .order("created_at", { ascending: false })
        .limit(10)
      if (error) throw error
      return data as ScanSummary[]
    },
    staleTime: 60_000,
  })
}
