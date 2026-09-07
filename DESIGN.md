---
name: KanbanLocal
version: 1.0.0
register: product
colors:
  neutral:
    lightBg: "#f1f5f9" # Slate 100
    darkBg: "#020617" # Slate 950
    lightPanel: "#ffffff" # Crisp solid white
    darkPanel: "rgba(15, 23, 42, 0.6)" # Translucent Slate 900
    borderLight: "#e2e8f0" # Slate 200
    borderDark: "rgba(255, 255, 255, 0.05)"
  accent:
    primary: "var(--project-color, #3b82f6)" # Dynamic project color
    ringOpacity: "0.12"
typography:
  fontFamily: "'Inter', sans-serif"
  scaleRatio: 1.125
  sizes:
    xs: "12px"
    sm: "14px"
    base: "16px"
    lg: "18px"
    xl: "20px"
    xxl: "24px"
spacing:
  base: "4px"
  rhythm: "8px"
  padding: "16px"
  gap: "24px"
---

# KanbanLocal Design Specification

## 1. Visual Identity & Atmosphere
KanbanLocal leverages a **translucent glassmorphic visual system** that functions beautifully across dark mode and custom background images.

### Spacing & Grid System
- Align all layout elements to a strict **4px/8px spatial grid**.
- Use `gap-6` (24px) for board columns and high-level panels.
- Card padding should be `p-4.5` (18px) to provide comfortable spacing for titles and tag indicators.

### Panel & Card Geometry
- **Main Panels / Columns**: Use `rounded-2xl` (16px) with a subtle crisp border (`border-slate-200/50` or `rgba(255, 255, 255, 0.08)`) and backdrop blur (`blur-25px`).
- **Task Cards**: Use `rounded-xl` (12px) with a border-bottom colored with a lower opacity mix of the project color.

---

## 2. Contrast & Color Guidelines
- **Contrast Check**: Main text, placeholders, and buttons must achieve at least a **4.5:1 contrast ratio**. Muted text on glass surfaces must be audited in both themes.
- **Dynamic Accent**: Accent colors (selected per-project) are injected via `var(--project-color)`. They must only highlight:
  - Focus rings (`focus:ring-var(--project-color)`).
  - Column header bottom markers.
  - Active badges, links, and primary action icons.
  - Drag states and selected filters.

---

## 3. Motion, Transitions & Interaction
- **Snappy Durations**: All hover transitions, dropdown collapses, and panel fades must complete within **150ms–200ms** to preserve a fast-acting desktop utility feel.
- **Easing Curve**: Use `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) for responsive feedback.
- **Reduced Motion**: Fall back immediately to instant transitions or simple opacity crossfades if `@media (prefers-reduced-motion: reduce)` is true.
- **Lag Prevention**: During dragging, do not apply translation transition animations to target list items to avoid frame drops.
