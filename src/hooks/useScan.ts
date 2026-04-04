import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { RiskReport } from "@/types/risk"

export function useScan(scanId: string | undefined) {
  return useQuery({
    queryKey: ["scan", scanId],
    queryFn: async (): Promise<RiskReport> => {
      const { data, error } = await supabase
        .from("scans")
        .select("id, report_json")
        .eq("id", scanId!)
        .single()
      if (error) throw new Error("Scan not found")
      const report = data.report_json as RiskReport
      report.scanId = data.id
      return report
    },
    enabled: !!scanId,
  })
}
