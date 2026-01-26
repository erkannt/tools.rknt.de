# AGENTS.md

This file contains guidelines and commands for agentic coding agents working in this repository.

## Project Overview

This is a Vite + Svelte application called "goldcards-log" built with:

- **Framework**: Vite + Svelte 5 with TypeScript
- **Package Manager**: npm (pnpm originally used but npm works fine)
- **Styling**: Pico CSS via CDN
- **Build Target**: Static site generation (Vite build)
- **State Management**: Svelte 5 runes ($state, $derived, $effect)

## Development Commands

### Core Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
npm run dev -- --open    # Opens browser automatically

# Build for production
npm run build

# Preview production build
npm run preview

# Makefile equivalents (if preferred)
make dev
make build
make prod-preview
```

### Code Quality & Type Checking

```bash
# Run type checking
npm run check
npm run check:watch    # Watch mode

# Run linting and formatting checks
npm run lint

# Format code
npm run format

# Manual equivalents
npx svelte-check --tsconfig ./tsconfig.json
npx prettier --check . && eslint .
npx prettier --write .
```

### Code Quality & Type Checking

```bash
# Run type checking
npm run check
npm run check:watch    # Watch mode

# Run linting and formatting checks
npm run lint

# Format code
npm run format

# Manual equivalents
npx svelte-check --tsconfig ./tsconfig.json
npx prettier --check . && eslint .
npx prettier --write .
```

## Code Style Guidelines

### Formatting (Prettier Configuration)

- **Indentation**: Tabs (useTabs: true)
- **Quotes**: Single quotes (singleQuote: true)
- **Trailing Commas**: None (trailingComma: "none")
- **Line Width**: 100 characters (printWidth: 100)
- **Svelte Files**: Uses svelte parser via prettier-plugin-svelte

### TypeScript Configuration

- **Strict Mode**: Enabled
- **Module Resolution**: Bundler
- **Path Aliases**: `$lib` points to `src/lib/` (SvelteKit default)
- **Import Extensions**: Automatic rewriting enabled

### ESLint Rules

- Extends: TypeScript recommended, Svelte recommended, Prettier
- `no-undef`: Disabled (TypeScript handles this)
- Files: `**/*.svelte`, `**/*.svelte.ts`, `**/*.svelte.js` have special parsing

### Naming Conventions

- **Files**: kebab-case for files, camelCase for variables/functions
- **Components**: PascalCase for Svelte components
- **Interfaces/Types**: PascalCase, descriptive names (e.g., `GoldCard`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Private Members**: Use `#` prefix for private class fields

### Import/Export Patterns

```typescript
// Use $lib alias for internal imports
import { getISOWeekInfo } from '$lib/isoweek';
import { LocalStorage } from '$lib/localStorage.svelte';

// External imports grouped separately
import { tick } from 'svelte';
import type { Article } from '$lib/types';
```

### Svelte 5 Patterns

- Use `$state()` for reactive state
- Use `$derived()` for computed values
- Use `$derived.by()` for complex derived computations
- Use `$effect()` for side effects
- Use `$props()` for component props
- Prefer class-based utilities with Svelte reactivity

### Error Handling

- Use TypeScript for compile-time error prevention
- Validate user input before processing (see `addGoldCard()` function)
- Use conditional rendering for empty/loading states
- Handle async operations with proper error boundaries

### File Organization

```
src/
├── lib/           # Shared utilities, types, components
├── App.svelte     # Main application component
├── Layout.svelte  # Layout wrapper component
├── main.ts        # Vite entry point
└── vite.d.ts      # Vite type declarations
```

src/
├── lib/ # Shared utilities, types, components
├── routes/ # SvelteKit pages and layouts
├── app.html # Root HTML template
└── app.d.ts # Global type declarations

```

### CSS/Styling

- External Pico CSS via CDN in layout
- Scoped `<style>` blocks in Svelte components when needed
- Utility classes from Pico CSS framework
- Minimal custom styling

### Testing

- No test framework currently configured
- When adding tests, consider Vitest + @testing-library/svelte
- Tests should be placed alongside source files or in `tests/` directory

## Development Workflow

1. **Use npm** for package management
2. **Run type checking** before commits: `npm run check`
3. **Format code** before commits: `npm run format`
4. **Lint code** to ensure quality: `npm run lint`
5. **Test in development** regularly: `npm run dev`
6. **Build verification**: Ensure `npm run build` succeeds before PRs

## Build & Deployment

- **Static Generation**: Uses Vite build
- **Output Directory**: `dist/`
- **Deployment**: Can be deployed to any static hosting service
- **Environment Variables**: Use .env files (gitignored except .env.example, .env.test)

## Browser Compatibility

- Modern browsers with ES2022+ support
- Uses Svelte 5 which requires modern JavaScript features
- localStorage API required for data persistence

## Special Notes

- This is a goldcard logging application with CSV import/export functionality
- Data is stored in browser localStorage using a custom reactive wrapper
- Uses ISO week calculations for organizing entries
- No server-side dependencies - purely client-side application

## Common Gotchas

- Always check `typeof localStorage !== 'undefined'` before using it
- Use `crypto.randomUUID()` for unique IDs (available in modern browsers)
- Date handling uses ISO format strings consistently
- File uploads use FileReader API - ensure proper error handling
```
