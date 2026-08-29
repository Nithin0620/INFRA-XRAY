## 2026-08-26 - Mobile Navigation Accessibility
**Learning:** When using Tailwind utility classes like `hidden sm:inline` to hide text labels on mobile navigation links, screen readers may perceive them as icon-only buttons with no accessible name. This creates an accessibility barrier for users navigating with assistive technology on small screens.
**Action:** Always provide an explicit `aria-label` or screen-reader-only text for links that might become visually icon-only at certain breakpoints.
## 2024-08-29 - File Input Accessibility
**Learning:** Hiding file inputs using `display: none` (`hidden` in Tailwind) makes them inaccessible to keyboard users and screen readers, as they cannot receive focus.
**Action:** Use Tailwind’s `sr-only` class to hide the input visually while keeping it in the accessible tree. Apply `focus-within:ring-*` styles to the parent `<label>` element to ensure keyboard focus is visible when the nested input is focused.

## 2026-08-29 - File Input Keyboard Accessibility
**Learning:** Using `display: none` (like Tailwind's `hidden` class) on file inputs completely removes them from the accessibility tree and keyboard focus order. This means keyboard users cannot trigger the file upload dialog without a mouse.
**Action:** Use visually hidden styles (like Tailwind's `sr-only` class) on `<input type="file">` instead of hiding it completely. Then, apply focus-within styles (like `focus-within:ring-2`) to its parent `<label>` element so that when a keyboard user tabs to the hidden input, a visible focus ring surrounds the label acting as the upload trigger.
