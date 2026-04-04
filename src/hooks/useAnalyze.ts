import { useMutation } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { RiskReport } from "@/types/risk"

export function useAnalyze() {
  return useMutation({
    mutationFn: async (url: string): Promise<RiskReport> => {
      const { data, error } = await supabase.functions.invoke("analyze", {
        body: { url },
      })
      if (error) throw new Error(error.message || "Analysis failed")
      if (data.error) {
        const err = new Error(data.error)
        if (data.rateLimited) {
          err.message = `Daily scan limit reached. Sign in for unlimited scans.`
        }
        throw err
      }
      return data as RiskReport
    },
  })
}
