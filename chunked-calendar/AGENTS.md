# AGENTS.md

This file contains guidelines and commands for agentic coding agents working in this repository.

## Project Overview

This is a **Svelte5 + TypeScript + Vite** calendar application that generates printable chunked calendars. The app displays full-year or quarter-per-page calendars with configurable styling options.

## Build & Development Commands

Before running any shell command you must add `~/mise/shims` to the `PATH` envvar.

### Primary Commands (via Makefile)

- `make dev` - Start development server on port 8080
- `make build` - Build for production
- `make prod` - Build and preview production build on port 8080
- `make check` - Run type checking (svelte-check + TypeScript)
- `make clean` - Remove node_modules and dist
- `make release` - Build and deploy to remote storage

### Direct npm/pnpm Commands

- `pnpm install` - Install dependencies
- `pnpm vite --port 8080` - Development server
- `pnpm vite build` - Production build
- `pnpm vite preview --port 8080` - Preview production build
- `pnpm svelte-check --tsconfig ./tsconfig.app.json` - Type checking
- `pnpm tsc -p tsconfig.node.json` - Node TypeScript checking

### Running Single Tests

This project does not currently have a test suite. If tests are added, they should be runnable with:

- `pnpm test` - Run all tests
- `pnpm test [filename]` - Run single test file

## Code Style Guidelines

### TypeScript & JavaScript

- Use **TypeScript** for all new files (`.ts` extension)
- Enable `checkJs: true` - type check JavaScript files in `.svelte` components
- Target **ES2022** with modern module syntax
- Use **ESNext** modules with import/export statements
- Prefer explicit return types for functions
- Use JSDoc comments for complex functions (see `src/lib/dates.ts` for examples)

### Svelte Components

- Use **Svelte 5** syntax with runes (`$state`, `$props`, `$derived`, `$derived.by`)
- Always specify `lang="ts"` in script tags
- Component files use `.svelte` extension
- Props should be typed with generic syntax: `$props<{ year: number; boldMonths: boolean; }>()`
- State variables use `$state()` rune
- Computed values use `$derived()` or `$derived.by()` runes

### Import Organization

```typescript
// 1. External libraries (node_modules)
import { mount } from "svelte";

// 2. Internal imports (relative paths)
import App from "./App.svelte";
import { getDatesForYear } from "./lib/dates";
```

### Naming Conventions

- **Files**: kebab-case for components (`FullYearOnePage.svelte`), camelCase for utilities (`dates.ts`)
- **Variables**: camelCase (`let year = $state(thisYear())`)
- **Functions**: camelCase with descriptive names (`getMondayOfISOWeek`)
- **Constants**: UPPER_SNAKE_CASE for magic numbers (`const ONE_DAY_MS = 24 * 60 * 60 * 1000`)
- **Classes**: PascalCase (if any classes are added)

### CSS & Styling

- Use **scoped CSS** within `<style>` blocks in Svelte components
- CSS custom properties (CSS variables) for theming (see `src/styles/defaults.css`)
- Utility-first approach with semantic class names
- Print-specific styles using `@media print` queries
- Responsive design with mobile-first approach
- Use `oklch()` for modern color definitions

### Error Handling

- Use TypeScript's strict type checking to prevent runtime errors
- Validate function parameters with type annotations
- Handle Date objects carefully (use UTC for calendar calculations to avoid DST issues)
- Use try-catch blocks for external API calls or file operations

### File Structure

```
src/
├── main.ts              # App entry point
├── App.svelte           # Root component
├── lib/                 # Utilities and shared components
│   ├── dates.ts         # Date calculation utilities
│   ├── *.svelte         # Reusable components
└── styles/              # Global styles
    ├── main.css         # Style entry point
    ├── defaults.css     # Base styles
    ├── reset.css        # CSS reset
    └── utopia.css       # Typography system
```

### Code Quality

- **Type checking**: Always run `make check` before committing
- **No console.log**: Remove debugging statements before commits
- **Function documentation**: Use JSDoc for complex utility functions
- **Magic numbers**: Extract named constants for numeric values
- **Date handling**: Use UTC dates for calendar calculations to avoid timezone issues

### Git & Deployment

- This project uses a **Makefile** for build automation
- Deployment target: `rknt/tools/chunked-calendar` via `mc mirror`
- Base path for production: `/chunked-calendar/` (configured in vite.config.ts)
- Use semantic commit messages following the existing pattern

### Development Workflow

1. Run `make dev` to start development server
2. Make changes with hot module replacement
3. Run `make check` to verify types
4. Test print functionality using browser print preview
5. Run `make build` to verify production build
6. Use `make prod` to test production build locally

### Browser Compatibility

- Target modern browsers (ES2022 features)
- Use `Intl.DateTimeFormat` for localized date formatting
- Print optimization is critical (this is a printing-focused app)

### Performance Considerations

- Calendar calculations are CPU-intensive but run once per component render
- Use derived runes to memoize expensive calculations
- Minimize re-renders in calendar grid components
- Consider virtualization for very large calendar displays (if added later)

## Testing Strategy (Future)

When adding tests:

- Use **Vitest** for unit testing (integrates well with Vite)
- Test date calculation utilities thoroughly (edge cases for leap years, ISO weeks)
- Test component rendering and props
- Test print-specific CSS behavior
- Add E2E tests for calendar generation and printing workflow
