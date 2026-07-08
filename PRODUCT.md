# Product

## Register

product

## Users

Crypto / DeFi participants making a live money decision — degens about to "ape into" a new token, airdrop farmers vetting a claim, people who just got an alpha call in a Twitter or Telegram group and want a gut-check before they connect a wallet or send funds.

They arrive mid-decision, often on mobile, with adrenaline up and time short. They are already fluent in the space (they know what a rug, a multisig, a depeg, an oracle is) and they are not looking to be educated from zero. Their job to be done: **"Before I commit money to this, tell me fast whether it's likely a scam or legit — and give me enough receipts that I can trust the answer."**

## Product Purpose

Paste any DeFi project / airdrop / protocol URL. The AI fetches the target page (Jina Reader) and searches third-party sources (Brave Search), then scores risk 0–100 across six dimensions — Smart Contract & Security, Economic & Financial, Governance & Transparency, Project Fundamentals, Market & Operations, Infrastructure — with red-flag rules that hard-cap the score (no audit → max 60, anon team + no multisig → max 50). It returns a shareable report and can emit a copyable deep-dive prompt for the user's own agent.

It exists because the fastest path to getting rugged is trusting a landing page. Success is a user who dodges a bad project, or gains enough grounded confidence to proceed, and shares the report link so the next person checks too.

## Brand Personality

Three words: **skeptical, irreverent, crypto-native.**

Playful degen on the surface, serious risk analysis underneath. The voice is meme-fluent and speaks the arena's language (ape, rug, DYOR, degen) without winking too hard or explaining the joke. It's the based friend who's watched a hundred rugs and will tell you straight — dry, a little paranoid, never preachy, never a compliance lecture. "Don't trust. Verify." is the ethos.

Edgy, not cute. The humor has teeth; it is not soft, pastel, or mascot-friendly. Emotional goal: the user feels armed and clear-headed enough to make the call — proceed or bail — without feeling talked down to.

## Anti-references

- **Enterprise fintech / compliance SaaS.** Navy-and-white, sterile, "enterprise trust", KYC-gate energy, boring dashboards. This is a tool for people already in the arena, not a bank onboarding flow.
- **Cute / pastel web3.** Rounded bubbles, soft pastels, friendly mascots, earnest-friendly onboarding. Too soft for a tool whose job is to make you doubt.
- **AI slop.** Generic dark SaaS, gradient text, identical icon-card grids, glassmorphism-by-default, tracked-uppercase eyebrows above every section.

## Design Principles

1. **Speed to verdict.** Users arrive with a decision already in motion. The path from URL to a legible risk answer is the shortest thing in the product; every screen answers "should I be worried?" before anything else.
2. **Skepticism, worn like a degen.** The whole job is to arm the user with reasons for doubt — delivered in crypto-native, meme-fluent voice. Irreverent on top, dead-serious underneath. Never cute, never a lecture.
3. **Show the receipts.** It's an AI verdict in a space full of scams, so credibility is the product. Always surface the sources, the six-dimension breakdown, and which red-flag rule capped the score. Never a black-box number.
4. **Serve comprehension of risk.** The payload is a scored report. Hierarchy, color, and layout exist to make risk legible at a glance — score → risk level → weakest dimensions → why — then reward the curious with depth on demand.
5. **Meet degens where they are.** Speak the audience's language and match their mental model. This is native to the people in the arena, not a translation layer for outsiders.

## Accessibility & Inclusion

Best-effort, not formally certified — no committed WCAG conformance level, but keep the habits already in the code and don't regress them:

- Reduced-motion gating for all animations (`prefers-reduced-motion`), including the neon-flicker that would otherwise breach the WCAG 2.3.1 flashing threshold.
- `:focus-visible` rings on interactive elements, a skip-to-content link, ARIA labels on icon-only controls.
- 44×44px minimum touch targets.

Ongoing watch-item, not a certification gate: the neon-on-near-black theme plus muted foregrounds and very small pixel fonts (`[6px]`/`[7px]`) put contrast and legibility at real risk. Treat contrast as a per-surface audit concern whenever a surface is touched.
