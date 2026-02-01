# AGENTS.md

This file contains guidelines and commands for agentic coding agents working in this repository.

## Project Overview

This is a Svelte + TypeScript + Vite application called "Slackify" that converts Markdown to Slack markup. The project uses:
- Svelte 5 with TypeScript
- Vite for build tooling
- Vitest for testing
- ESLint for linting
- PNPM for package management
- Makefile for common commands

## Development Commands

### Essential Commands
- `make dev` or `npx vite --port 8080` - Start development server on port 8080
- `make build` or `npx vite build` - Build for production
- `make prod` or `npx vite preview --port 8080` - Preview production build

### Testing Commands
- `make test` or `npx vitest run` - Run all tests
- `npx vitest run <filename>` - Run a single test file
- `npx vitest watch` - Run tests in watch mode (for development)

### Code Quality Commands
- `make check` or `make svelte-check` - Run type checking and Svelte validation
- `npx svelte-check --tsconfig ./tsconfig.app.json` - Svelte-specific type checking
- `npx tsc -p tsconfig.node.json` - TypeScript compilation check
- `npx eslint <files>` - Run ESLint on specific files

### Utility Commands
- `make clean` - Remove node_modules and dist directories
- `pnpm install --frozen-lockfile` - Install dependencies with exact versions

## Code Style Guidelines

### General Principles
- Use TypeScript everywhere (including Svelte components with `lang="ts"`)
- Follow Svelte 5 patterns using modern runes (`$state`, `$derived`, etc.)
- Keep components small and focused on single responsibilities
- Use functional programming patterns for data transformation

### Import Organization
- Group imports in this order: 1) External libraries, 2) Internal modules, 3) Relative imports
- Use named imports when possible: `import { mount } from "svelte"`
- For Svelte components: `import App from "./App.svelte"`
- No unused imports - keep imports clean and minimal

### TypeScript Conventions
- Use explicit return types for functions: `slackify(input: string): string`
- Prefer `const` over `let` when variables don't need reassignment
- Use type inference for obvious cases, explicit types for complex ones
- Utilize the non-null assertion operator (`!`) judiciously when you're certain of non-null values

### Svelte Component Structure
```svelte
<script lang="ts">
    // Imports first
    import { functionName } from "./module";
    
    // State and reactive declarations
    let variable = $state("");
    let computed = $derived(functionName(variable));
    
    // Functions
    const handleClick = () => {
        // handler logic
    };
</script>

<!-- Template markup -->
<main>
    <!-- HTML content -->
</main>

<style>
    /* Component-specific styles */
    /* Use nested selectors when appropriate */
    .container {
        /* styles */
    }
</style>
```

### Naming Conventions
- **Files**: PascalCase for components (`App.svelte`), camelCase for utilities (`slackify.ts`)
- **Variables/Functions**: camelCase (`slackify`, `markdown`, `clear`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **CSS Classes**: kebab-case for class names (`slackified-output`)
- **Components**: PascalCase for component names in imports and usage

### Error Handling
- Use proper TypeScript types to catch errors at compile time
- For user input functions, validate inputs and handle edge cases gracefully
- Return meaningful error messages or fallback values
- Consider using try-catch blocks for operations that might fail

### CSS and Styling
- Organize styles in separate files under `src/styles/`
- Use CSS imports in main.css for modular styling
- Prefer component-scoped styles in `<style>` blocks
- Use semantic HTML5 elements (`main`, `section`, `header`)
- Follow BEM-like naming for complex CSS classes when needed

### File Organization
- `src/` - All source code
- `src/styles/` - CSS files (reset, utilities, defaults, main)
- `public/` - Static assets served as-is
- Keep utility functions separate from UI components
- Use clear, descriptive file names that indicate purpose

### Testing Guidelines
- Place test files alongside source files or in a dedicated test directory
- Write descriptive test names that explain what is being tested
- Test both happy path and edge cases
- Use Vitest's built-in assertions and mocking capabilities
- Aim for good coverage of critical business logic

### Performance Considerations
- Use `$derived` for computed values that depend on state
- Avoid unnecessary re-renders by properly structuring reactive dependencies
- For large text processing (like in slackify), consider debouncing if needed
- Use efficient algorithms for string manipulation and transformation

### Git Workflow
- Make small, focused commits with clear messages
- Run `make check` before committing to ensure type safety
- Keep the main branch stable with all tests passing
- Use feature branches for new functionality

## Development Notes

- The project uses a Makefile as the primary interface for common operations
- PNPM is the preferred package manager (install via mise if not available)
- The app is designed to be a simple utility tool with minimal dependencies
- Focus on user experience and clear conversion between Markdown and Slack markup