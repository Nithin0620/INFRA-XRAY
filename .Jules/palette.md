## 2026-08-26 - Mobile Navigation Accessibility
**Learning:** When using Tailwind utility classes like `hidden sm:inline` to hide text labels on mobile navigation links, screen readers may perceive them as icon-only buttons with no accessible name. This creates an accessibility barrier for users navigating with assistive technology on small screens.
**Action:** Always provide an explicit `aria-label` or screen-reader-only text for links that might become visually icon-only at certain breakpoints.
## 2026-08-28 - [Upload Form Accessibility]
**Learning:** The Upload page's form lacked explicit programmatic associations between labels and input fields. While visual proximity implies connection, screen readers and assistive technologies require explicit `htmlFor` (label) and `id` (input) mapping. This is a common pattern to check for across the application.
**Action:** Always ensure `htmlFor` on labels is matched with the `id` of inputs, especially when designing new forms or components in this codebase.
