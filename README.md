# IsThisSafeToApe

AI-powered risk assessment for DeFi projects. Paste a URL, get a detailed safety report.

## What It Does

Enter any DeFi project, airdrop, or crypto protocol URL. The AI fetches the target page and searches third-party sources, then analyzes everything across 6 dimensions and returns a scored risk report (0–100):

- **Smart Contract & Security** — audit status, code quality, centralization risks
- **Economic & Financial** — tokenomics, liquidity, yield sustainability
- **Governance & Transparency** — on-chain reserves, team doxxing, community governance
- **Project Fundamentals** — team background, milestones, compliance
- **Market & Operations** — market position, growth, partner dependencies
- **Infrastructure Risk** — oracle, bridge, MEV, frontend security

Red flag rules automatically cap scores (e.g., no audit → max 60, anonymous team + no multisig → max 50).

## Features

- **Web research** — fetches the target site via [Jina Reader](https://jina.ai/reader/) and searches external sources via [Brave Search API](https://brave.com/search/api/) before analysis
- **Deep dive prompt** — generates a copyable prompt from the report so you can hand it to your own AI agent for deeper investigation, with dynamic suggestions based on weak scoring categories
- Cyberpunk/retro pixel-art UI with neon glow effects
- Shareable report links (`/report/:id`)
- 24-hour scan caching per hostname
- Anonymous usage (3 scans/day) or sign in for unlimited
- IP-based rate limiting with SHA-256 hashed fingerprints

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **UI Components**: shadcn/ui (Radix primitives)
- **Backend**: Supabase Edge Functions (Deno)
- **AI**: Claude (Haiku 4.5) via Anthropic SDK, with web research (Jina Reader + Brave Search)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (frontend) + Supabase (backend)

## Getting Started

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Fill in:
#   VITE_SUPABASE_URL=
#   VITE_SUPABASE_PUBLISHABLE_KEY=

# Start dev server
bun run dev
```

### Supabase Setup

1. Create a Supabase project
2. Run the migrations in `supabase/migrations/` in order
3. Deploy the edge function:
   ```bash
   supabase functions deploy analyze
   ```
4. Set edge function secrets:
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   supabase secrets set JINA_API_KEY=jina_...
   supabase secrets set BRAVE_SEARCH_API_KEY=...
   ```

## License

MIT
