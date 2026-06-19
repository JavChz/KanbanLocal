# PersonalKanban

PersonalKanban is a static, local-first Single Page Application designed as a simple alternative to standard todo lists. The application does not utilize a backend database, API, or external storage. All user configurations, tasks, and project definitions are saved locally in the browser via localStorage using Zustand persistence.

## Project Status

This project is in alpha development and is maintained as a hobby. There is no guarantee of long-term maintenance or future updates. Users should consult the latest commit history to determine if the project is still actively maintained.

## Privacy and Security

While the application executes entirely within the local web browser environment, it is hosted on GitHub Pages. No guarantee is made regarding the security of the GitHub Pages platform, nor can it be verified that GitHub Pages does not execute traffic analysis or collect user telemetry.

## Internationalization

The application supports English, French, Japanese, and Spanish languages. Translations are managed programmatically and may contain semantic or syntax errors.

## Project Structure and Technologies

- Framework: React with TypeScript (via Vite)
- Styling: Tailwind CSS v4
- State Management: Zustand (using persist middleware)
- Drag and Drop: @dnd-kit/core
- Icons: Lucide React
- Routing: react-router-dom
- Tests: Playwright
- Isolation: Storybook

## Installation and Execution

Clone the repository and install the dependencies:

```bash
npm install
```

To run the application locally in development mode:

```bash
npm run dev
```

To execute the end-to-end test suite:

```bash
npx playwright test
```

To run the Storybook components library:

```bash
npm run storybook
```

To compile the production build:

```bash
npm run build
```
