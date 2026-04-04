import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export interface ScanSummary {
  id: number
  url: string
  url_hostname: string
  project_name: string | null
  total_score: number | null
  max_score: number | null
  risk_level: string | null
  risk_label: string | null
  tldr: string | null
  created_at: string
}

export function useHistory() {
  return useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("scans")
        .select("id, url, url_hostname, project_name, total_score, max_score, risk_level, risk_label, tldr, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)
      if (error) throw error
      return data as ScanSummary[]
    },
  })
}
