## 2026-08-26 - Mobile Navigation Accessibility
**Learning:** When using Tailwind utility classes like `hidden sm:inline` to hide text labels on mobile navigation links, screen readers may perceive them as icon-only buttons with no accessible name. This creates an accessibility barrier for users navigating with assistive technology on small screens.
**Action:** Always provide an explicit `aria-label` or screen-reader-only text for links that might become visually icon-only at certain breakpoints.

## 2026-10-27 - File Input Accessibility
**Learning:** Using `display: none` (like Tailwind's `hidden` class) on an `<input type="file">` removes it from the accessibility tree and prevents keyboard users from focusing it to trigger the file picker.
**Action:** Use `sr-only` to visually hide the file input while keeping it focusable. Additionally, ensure the associated visible `<label>` has a `focus-within` state (e.g., `focus-within:ring-2`) to provide a clear visual focus indicator when the hidden input is focused via keyboard.
