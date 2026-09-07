# KanbanLocal - Product Context

## 1. Vision & Purpose
KanbanLocal is a local-first, privacy-respecting, and high-performance personal task tracker designed to manage multiple projects seamlessly from a unified, fast interface.
- **Primary Register**: `product` (The design exists to help the user complete tasks efficiently. Earned familiarity, visual hierarchy, and precise alignment are key).
- **Core Value Proposition**: Absolute offline stability, instant rendering, local-first backup/restore, and seamless support for multiple boards.
- **Target Audience**: Developers, designers, and organizers seeking a distraction-free productivity environment with instant feedback and zero cloud tracking.

## 2. Brand & Visual Personality
- **Voice & Tone**: Clean, technical, and precise. Copy must be direct, zero-hype, and supportive of a focused flow state.
- **Visual Stance**: Modern, refined, and technical. The UI employs clean translucent glassmorphism (blurs, glass panels) that blends with dark mode and custom project background images, allowing the interface to feel lightweight and responsive.

## 3. Operational Rules & Guardrails
- **Offline Reliability**: The app must remain fully functional without any internet connection. All states are persisted locally in `localStorage`.
- **Performance Thresholds**: Drag-and-drop actions must be highly optimized. Avoid layout shifts or CSS property transitions that recalculate layout during active drags.
- **Dynamic Accents**: The accent color (`--project-color`) must be applied in a restrained manner, highlighting only focus rings, active tags, drag states, and indicators, rather than coloring structural panel backgrounds.
- **Forbidden Patterns**:
  - Do not use opaque saturated warm backgrounds (e.g. sand, beige, paper) by default; the neutral theme is cool/slate.
  - Do not nest cards within cards.
  - Do not add non-functional motion or heavy bounce easing curves.
