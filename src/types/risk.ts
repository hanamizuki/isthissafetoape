export interface CategoryScore {
  name: string
  score: number
  maxScore: number
  summary: string
  details: string[]
}

export interface RedFlag {
  title: string
  description: string
  severity: "critical" | "high" | "medium"
}

export interface RiskReport {
  scanId?: number
  projectName: string
  projectUrl: string
  totalScore: number
  maxScore: number
  riskLevel: "low" | "moderate" | "high" | "very-high" | "critical"
  riskLabel: string
  tldr: string
  categories: CategoryScore[]
  redFlags: RedFlag[]
  positives: string[]
  analyzedAt: string
}
