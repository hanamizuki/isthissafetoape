import { Link } from "react-router-dom"

/**
 * Shared site header used across all pages.
 * Renders the logo, brand name, GitHub link, and optional right-side content.
 * Standardizes on shield-logo.svg for consistency.
 */
export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <>
      {/* Skip navigation link — visually hidden until focused */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-background focus:font-pixel focus:text-sm"
      >
        Skip to main content
      </a>
      {/* Opaque bg on mobile to skip backdrop-blur compositing; translucent + blur on desktop */}
      <header className="relative z-10 border-b-2 border-cyan-500/20 bg-background md:bg-background/90 md:backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <img src="/shield-logo.svg" alt="" className="h-7 w-7 neon-drop-cyan" />
          <span className="font-pixel text-base sm:text-lg text-cyan-400 neon-text-cyan font-bold">
            IsThisSafeToApe
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {children}
          {/* GitHub repo link — min 44×44 touch target via padding */}
          <a
            href="https://github.com/hanamizuki/isthissafetoape"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center min-w-[44px] min-h-[44px] text-muted-foreground hover:text-cyan-400 transition-colors"
            title="View source on GitHub"
            aria-label="View source on GitHub"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
        </div>
      </div>
    </header>
    </>
  )
}
