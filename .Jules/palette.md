## 2026-08-26 - Mobile Navigation Accessibility
**Learning:** When using Tailwind utility classes like `hidden sm:inline` to hide text labels on mobile navigation links, screen readers may perceive them as icon-only buttons with no accessible name. This creates an accessibility barrier for users navigating with assistive technology on small screens.
**Action:** Always provide an explicit `aria-label` or screen-reader-only text for links that might become visually icon-only at certain breakpoints.
