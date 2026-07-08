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

// A supply-chain dependency of the analyzed protocol. name/relationship come from the
// LLM; website/category/slug are resolved server-side from a trusted source (never the
// LLM — a hallucinated URL is a phishing vector). Unresolved entries carry name only.
export interface RelatedProtocol {
  name: string
  relationship: string
  website?: string
  category?: string
  slug?: string
}

// The analyzed protocol itself, resolved so it can be subscribed to (feature 2).
export interface PrimaryProtocol {
  name: string
  website?: string
  category?: string
  slug?: string
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
  // Optional: absent on reports cached before this feature shipped — the UI hides the
  // section when the field is missing.
  relatedProtocols?: RelatedProtocol[]
  primaryProtocol?: PrimaryProtocol
  analyzedAt: string
}
