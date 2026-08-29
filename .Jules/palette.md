## 2026-08-26 - Mobile Navigation Accessibility
**Learning:** When using Tailwind utility classes like `hidden sm:inline` to hide text labels on mobile navigation links, screen readers may perceive them as icon-only buttons with no accessible name. This creates an accessibility barrier for users navigating with assistive technology on small screens.
**Action:** Always provide an explicit `aria-label` or screen-reader-only text for links that might become visually icon-only at certain breakpoints.
## 2024-08-29 - File Input Accessibility
**Learning:** Hiding file inputs using `display: none` (`hidden` in Tailwind) makes them inaccessible to keyboard users and screen readers, as they cannot receive focus.
**Action:** Use Tailwind’s `sr-only` class to hide the input visually while keeping it in the accessible tree. Apply `focus-within:ring-*` styles to the parent `<label>` element to ensure keyboard focus is visible when the nested input is focused.
