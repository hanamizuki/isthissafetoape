---
name: IsThisSafeToApe
description: AI DeFi risk scanner — paste a URL, get a pixel-arcade risk verdict.
colors:
  neon-cyan: "#22d3ee"
  primary-teal: "#0df2db"
  cyan-action: "#06b6d4"
  neon-green: "#10b981"
  neon-yellow: "#e8ff00"
  neon-orange: "#f97316"
  neon-pink: "#ff2d78"
  destructive: "#ff1a53"
  void-bg: "#050a14"
  surface: "#0a111f"
  surface-raised: "#141d2e"
  border-slate: "#192234"
  ink: "#d7e8ea"
  ink-muted: "#6c8093"
typography:
  display:
    fontFamily: "Pixelify Sans, Press Start 2P, monospace"
    fontSize: "2.25rem–5rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "normal"
  headline:
    fontFamily: "Pixelify Sans, Press Start 2P, monospace"
    fontSize: "1.5rem–1.875rem"
    fontWeight: 700
    lineHeight: 1.15
  title:
    fontFamily: "Pixelify Sans, Press Start 2P, monospace"
    fontSize: "0.875rem–1rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Press Start 2P, Silkscreen, monospace"
    fontSize: "0.625rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.08em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  none: "0px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.cyan-action}"
    textColor: "{colors.void-bg}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "0 1.5rem"
    height: "3rem"
  button-primary-hover:
    backgroundColor: "{colors.neon-cyan}"
    textColor: "{colors.void-bg}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.neon-cyan}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "0 1rem"
  input-search:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.none}"
    height: "3rem"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "1.25rem"
  status-pill:
    backgroundColor: "transparent"
    textColor: "{colors.neon-green}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.375rem 0.75rem"
---

# Design System: IsThisSafeToApe

## 1. Overview

**Creative North Star: "The Degen Arcade Cabinet"**

IsThisSafeToApe is a neon coin-op machine that tells you whether to ape. You feed it a URL like you'd feed it a quarter; it renders a verdict in Pixelify Sans, drops your risk as a ten-segment HP bar, and glows at you from a dark cabinet. The whole surface is a CRT: scanlines wash over near-black glass, cyan phosphor bleeds off the edges of text, and every label reads like it was silkscreened onto an arcade bezel. This is the visual expression of the product's voice — playful degen on the surface, dead-serious risk analysis underneath. It speaks the arena's language (ape, rug, DYOR) in a typeface that grins, then hands you a score that doesn't.

Density is deliberate and vertical: a single centered column, generous breathing room between blocks, no side rails or dashboards. The user arrives mid-decision, so the machine answers fast — score first, verdict second, receipts on demand. Color is never decoration; it is the verdict itself, mapped from a green-to-pink risk spectrum that a degen reads before they read a single word.

This system explicitly rejects three things, carried from the product's anti-references. It is **not enterprise fintech / compliance SaaS** — no navy-and-white, no sterile trust badges, no KYC-gate energy. It is **not cute / pastel web3** — the humor has teeth; nothing here is rounded, soft, mascot-friendly, or earnest. And it is **not AI slop** — no gradient text, no identical icon-card grids, no glassmorphism-by-default, no tracked-uppercase eyebrow floating above every section as reflex scaffolding.

**Key Characteristics:**
- **Arcade-cabinet dark**: near-black `#050a14` glass, cyan phosphor glow, CRT scanline overlay.
- **Sharp everywhere**: zero border radius. Corners are pixels, not pills.
- **Color as verdict**: a green→yellow→orange→pink risk spectrum that carries meaning, never mood.
- **Pixel identity, readable body**: Pixelify Sans for the machine's voice; Space Grotesk for anything a human actually reads.
- **Glow, not shadow**: depth comes from neon bloom and border intensity, never drop shadows.
- **Readability wins every conflict** (the spine of this system; see the Readable-Floor Rule).

## 2. Colors

A dark cabinet lit by one cyan tube and a four-stop danger spectrum. Cyan is the machine talking; the spectrum is the verdict.

### Primary
- **Neon Cyan** (`#22d3ee`, Tailwind `cyan-400` / `--neon-cyan-rgb`): the machine's voice. Wordmark, headings, borders, focus glow, kicker labels, links, the "alive" cyan bloom (`neon-text-cyan`, `neon-box-cyan`). The single most-used color on every screen.
- **Primary Teal** (`#0df2db`, `--primary` / `--accent` / `--ring`, HSL `174 90% 50%`): the theme token behind `:focus-visible` rings and default shadcn primaries. Brighter and greener than Neon Cyan — see the One-Cyan Rule.
- **Cyan Action** (`#06b6d4`, Tailwind `cyan-500`): the fill of the one true CTA (the SCAN button), brightening to Neon Cyan on hover.

### Secondary — The Risk Spectrum
The four-stop scale that colors every score, gauge segment, risk badge, and red-flag dot. This is the semantic core; a degen reads the color before the number.
- **Safe Green** (`#10b981`, `emerald` / `--neon-green-rgb`): low risk, positive signals, "READY / UNLIMITED" status, filled gauge at ≥70%.
- **Caution Yellow** (`#e8ff00`, `--neon-yellow-rgb`): moderate risk, medium-severity flags, daily-limit warnings, gauge 50–69%.
- **Alarm Orange** (`#f97316`, `orange-500`): high risk, high-severity flags, gauge 30–49%.
- **Danger Pink** (`#ff2d78`, `--neon-pink-rgb`): very-high / critical risk, red-flag panels, scan-failure errors, gauge <30%.

### Neutral
- **Void** (`#050a14`, HSL `220 60% 5%`): the body — the dark glass everything sits on.
- **Surface** (`#0a111f`, HSL `220 50% 8%`): cards, popovers, translucent panels (`bg-card/50`).
- **Surface Raised** (`#141d2e`, HSL `220 40% 13%`): secondary / muted panels, inactive fills.
- **Border Slate** (`#192234`, HSL `220 35% 15%`): default hairline borders and input strokes at rest.
- **Ink** (`#d7e8ea`, HSL `185 30% 88%`): primary reading text — a cyan-tinted off-white, never pure white for long copy.
- **Ink Muted** (`#6c8093`, HSL `210 15% 50%`): secondary text, captions, meta. Sits near the 4.5:1 floor on Void — see the Readable-Floor Rule; never stack opacity below it on top.

### Named Rules
**The Risk-Color Rule.** The green→yellow→orange→pink spectrum means exactly one thing: verdict severity. Never use a spectrum color for decoration, mood, or brand flourish. If pink appears, something is dangerous. If a screen wants "a warm accent," it uses Neon Cyan, not the spectrum.

**The One-Cyan Rule.** Three cyans, one role each — Neon Cyan (`#22d3ee`, `cyan-400`): brand text, borders, glow, kickers; Cyan Action (`#06b6d4`, `cyan-500`): the CTA fill only; Primary Teal (`#0df2db`, `--ring`): the focus-ring token. Borders and glow both sit on Neon Cyan. Do not introduce a fourth. When two would read as "the same cyan" to a user, converge on Neon Cyan.

**The Readable-Ink Rule.** Reading text is Ink (`#d7e8ea`) or, at most, Ink Muted (`#6c8093`) at full opacity. Gray-on-neon and low-opacity muted text on Void fail contrast; if body copy is even close to 4.5:1, it goes to Ink.

## 3. Typography

**Display Font:** Pixelify Sans (with Press Start 2P, monospace fallback)
**Body Font:** Space Grotesk (with system-ui, sans-serif fallback)
**Label Font:** Press Start 2P (with Silkscreen, monospace fallback) — the arcade-bezel silkscreen
**Data/Mono:** system monospace — URLs, the deep-dive prompt box, the search field

**Character:** A hard contrast pairing, not a subtle one: chunky pixel display against a clean geometric-humanist sans. Pixelify Sans is the cabinet's grinning voice; Space Grotesk is the plain-spoken analyst. They never blur into each other because they share nothing — which is exactly why the pairing works.

### Hierarchy
- **Display** (Pixelify Sans 700, 2.25–5rem / `text-4xl`→`text-[5rem]`, line-height 1.1): hero verdict ("Don't trust. Verify."), the big risk score. The loudest the machine gets.
- **Headline** (Pixelify Sans 700, 1.5–1.875rem / `text-2xl`→`text-3xl`): scanned project name on the report.
- **Title** (Pixelify Sans 700, 0.875–1rem / `text-sm`→`text-base`): section headings ("RED FLAGS", "Recent Scans"), feature titles, button text.
- **Body** (Space Grotesk 400, 0.875rem / `text-sm`, line-height 1.6): descriptions, summaries, TL;DR, red-flag copy. Cap prose at 65–75ch (the report column already sits at `max-w-3xl`).
- **Label** (Press Start 2P 400, ~0.625rem, letter-spacing 0.08em, UPPERCASE): the arcade kickers and status tags ("TARGET:", "TL;DR", "SCAN COMPLETE", "UNLIMITED"). A deliberate named system, not reflex eyebrows — but bound by the Readable-Floor Rule.
- **Mono** (system monospace, 0.75–1.125rem / `text-xs`→`text-lg`): target URLs, the copyable deep-dive prompt, the terminal-style search input (`> enter_url...`), and inline numeric scores in scan lists and category cards.

### Named Rules
**The Pixel-Display Rule.** Pixelify Sans and Press Start 2P carry identity — headings, scores, wordmark, kickers. The moment text exists to be *read* rather than *recognized* (any sentence, any paragraph, any explanation), it is Space Grotesk. Pixel fonts never carry a paragraph.

**The Readable-Floor Rule.** *Readability wins every conflict with the theme.* Press Start 2P is near-unreadable below ~10px; earlier code shipped `text-[6px]`/`text-[7px]` labels, now raised to the ~10px floor. New work never goes below ~10px on pixel labels, never puts Ink Muted below full opacity for text, and never sacrifices a score, verdict, or sentence to the retro skin. The cabinet can look tiny; the verdict must always be legible.

## 4. Elevation

There are no drop shadows. This is a flat, sharp-cornered system where depth is manufactured entirely from light: neon glow, border intensity, and translucent layering over the dark glass. A surface at rest is a `border-2` box on near-transparent fill (`bg-white/[0.01]`); it gains presence by glowing, not by lifting.

### Shadow Vocabulary
- **Cyan Glow** (`neon-box-cyan`: `0 0 5px rgba(34,211,238,.3), 0 0 15px rgba(34,211,238,.15), inset 0 0 10px rgba(34,211,238,.05)`): the default "this box is alive" treatment on primary panels and the search bar.
- **Green / Pink Glow** (`neon-box-green` / `neon-box-pink`): same recipe in Safe Green and Danger Pink — positive-signal and red-flag panels announce their verdict through their glow color.
- **Text Bloom** (`neon-text-*`: layered `text-shadow` at 6/15/28px): phosphor bleed on headings, scores, and the wordmark. Reduced to a single 4px shadow on mobile to save compositing.
- **Ambient Orbs**: large radial `blur-[120px]` cyan/emerald fields bled off the viewport corners (desktop only) — the cabinet's backlight.
- **CTA Cast** (`shadow-[0_0_15px_rgba(34,211,238,0.4)]` → `0_0_25px…0.6` on hover): the SCAN button throws cyan light onto the glass and throws more when you reach for it.

### Named Rules
**The Glow-Not-Shadow Rule.** Depth is light, never darkness. If an element needs to feel raised or active, it glows brighter or its border climbs in opacity (`border-cyan-500/15` → `/40` on hover) — it never drops a gray shadow. A gray `box-shadow` anywhere is a bug: it reads as a 2014 web app pasted onto an arcade cabinet.

## 5. Components

### Buttons
- **Shape:** hard rectangles, zero radius (`rounded-none`), Pixelify Sans bold text.
- **Primary (SCAN):** Cyan Action (`#06b6d4`) fill on Void text, tall (`h-12`), throwing a cyan CTA cast that intensifies on hover as the fill brightens to Neon Cyan. There is one primary action per screen.
- **Outline / Ghost:** transparent on a `border-2` Neon-Cyan stroke at low opacity (`/30`), Neon-Cyan text; hover raises border opacity and adds a faint cyan bg wash (`hover:bg-cyan-500/10`). Used for secondary/nav actions ("SIGN IN", "GO BACK", "RETRY").
- **Focus:** `:focus-visible` ring in Primary Teal, offset from the Void bg. Never removed.
- Note: the shadcn `Button` base is present but overridden per-use toward sharp corners and neon; treat the neon rectangle as the real primitive.

### Inputs / Fields
- **Style:** the field itself is transparent and border-less, living *inside* a `border-2` Neon-Cyan container (`/25`) that carries the Cyan Glow — the container is the input, visually. Monospace text, terminal placeholder (`> enter_url...`) in Neon Cyan at low opacity.
- **Focus:** the inner field's own ring is suppressed (`focus-visible:ring-0`); the glowing container is the focus affordance. A pulsing Safe-Green dot + "READY TO SCAN" label sits beneath as a liveness cue.

### Panels / Containers
- **Corner Style:** sharp, zero radius.
- **Background:** Surface at half-opacity (`bg-card/50`) or a near-transparent white wash (`bg-white/[0.01]`) over Void.
- **Border:** `border-2`, colored *by meaning* — Neon Cyan for neutral/info, Danger Pink for red flags, Safe Green for positives, Caution Yellow for warnings. The border is the panel's label.
- **Glow:** matching neon-box glow reinforces the border's verdict color. Internal padding is generous (`p-5`, ~20px).
- These hand-rolled semantic panels — not the shadcn `Card` — are the real container primitive. Never nest them.

### Badges / Status Pills
- **Style:** hand-rolled `<span>`, sharp, `border-2`, Press Start 2P uppercase, colored by state — Safe Green "UNLIMITED", Neon Cyan "FREE · 3/DAY", risk-spectrum "RISK LABEL". Not the shadcn rounded-full `Badge`.
- **State:** the pill's color IS its meaning (Risk-Color Rule). Bound by the Readable-Floor Rule on size.

### Navigation (Header)
- Sticky top bar, `border-b-2` Neon Cyan `/20`. Shield logo with cyan drop-glow + Pixelify Sans wordmark in cyan bloom. Icon links (history, sign-out, GitHub) are 44×44px touch targets in Ink Muted, brightening to Neon Cyan on hover. A skip-to-content link precedes it. Opaque bg on mobile; translucent + `backdrop-blur` on desktop only (perf).

### Signature: The Pixel Score Gauge
The machine's centerpiece and the North Star made literal. A large Pixelify Sans score (`text-4xl`→`text-5xl`) painted in the risk-spectrum color, above a **ten-segment HP bar**: filled segments in the verdict color, empty segments in `rgba(255,255,255,0.06)`, a `/maxScore` label beneath. The same segmented bar recurs inside every `CategoryCard`, thresholded per-category (≥70 green, ≥50 yellow, ≥30 orange, else pink). This bar is the product's single most recognizable object — an arcade health meter for a DeFi project's life expectancy. The large gauge score stays Pixelify Sans (the signature); smaller inline scores — category cards, scan-history and recent-scan rows — are set in mono for legibility.

### Signature: The CRT Scanline Overlay
A fixed, full-viewport `repeating-linear-gradient` of faint 2px dark lines (`.scanlines`), pointer-events-none, sitting above content. It makes every screen feel like glass in a dark cabinet. Disabled below 768px to save a full-screen compositing layer.

## 6. Do's and Don'ts

### Do:
- **Do** answer with the score first. Verdict (score + risk label + TL;DR) reads above the fold; the six-dimension breakdown and deep-dive prompt are the receipts below.
- **Do** let color carry the verdict — green→yellow→orange→pink for severity, Neon Cyan for the machine's voice, and nothing decorative from the spectrum.
- **Do** keep corners sharp (`rounded-none`) and depth made of glow (`neon-box-*`, border-opacity climbs on hover).
- **Do** set body copy in Space Grotesk at Ink (`#d7e8ea`); reserve Pixelify Sans / Press Start 2P for identity, the big gauge score, and kickers — small inline scores use mono.
- **Do** hold pixel labels at ~10px or larger and keep every animation gated behind `prefers-reduced-motion` (blink, neon-flicker, breathe).
- **Do** use full `border-2` borders and semantic panel colors as the container vocabulary; one flat panel, never nested.

### Don't:
- **Don't** drift toward **enterprise fintech / compliance SaaS** — no navy-and-white, no sterile trust badges, no KYC-gate chrome. This is a tool for people already in the arena.
- **Don't** go **cute / pastel web3** — no rounded bubbles, soft pastels, friendly mascots, or earnest onboarding. The humor has teeth.
- **Don't** ship **AI slop**: no gradient text (`background-clip: text`), no identical icon-card grids, no glassmorphism-by-default, no tracked-uppercase eyebrow above every section as reflex scaffolding. (The pixel kicker is a *deliberate named system* — that is the allowed exception, not license to eyebrow everything.)
- **Don't** ship `text-[6px]` / `text-[7px]` pixel labels or text below full opacity — hold pixel labels at the ~10px floor. Readability wins every conflict with the theme.
- **Don't** add a gray `box-shadow` anywhere. Depth is light; a dark shadow reads as a 2014 app glued onto the cabinet.
- **Don't** introduce a fourth cyan, and don't use a risk-spectrum color as a mood accent. If pink is on screen, something is dangerous.
