---
type: domain
title: "Frontend Accessibility"
created: 2026-04-25
updated: 2026-04-25
status: mature
tags: [accessibility, a11y, aria, frontend]
related: ["[[CarbonTracker Component]]", "[[Frontend Error Handling]]"]
sources: ["[[.raw/graphify-audit-2026-04-25.md]]"]
---

# Frontend Accessibility

Accessibility fixes applied in commit 8d50d17.

## Changes

### CarbonTracker — Delete button (F6)
```jsx
// Before
<button title="Remove log">✕</button>

// After
<button title="Remove log" aria-label={`Remove log for ${log.product_name}`}>✕</button>
```
`title` alone is not reliably announced by screen readers. `aria-label` takes precedence.

### Tips — Expand/collapse button (F7)
```jsx
<button
  aria-expanded={isOpen}
  aria-label={`${isOpen ? "Collapse" : "Expand"} ${section.category} tips`}
>
```
The chevron icon (`▾`) has no text content. Without `aria-label`, screen readers announce an unlabelled button.

### Recipes — Expand/collapse button (F8)
```jsx
<button
  aria-expanded={expandedId === recipe.id}
  aria-label={`${expandedId === recipe.id ? "Collapse" : "Expand"} ${recipe.name}`}
>
```

## aria-expanded Semantics

`aria-expanded` must be a boolean attribute on the toggle control itself (not the expandable region). It communicates current collapsed/expanded state to assistive technology. The expandable content element should have `id` + the button should reference it with `aria-controls` for full compliance — not yet done, but `aria-expanded` + `aria-label` alone is a substantial improvement.
