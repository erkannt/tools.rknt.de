# Rituals - Project Learnings

## Overview
A lightweight PWA for creating, using, and sharing ritualized checklists/habits. All data stored locally in browser.

## Tech Stack
- **Framework:** Svelte 5 with runes (`$state`, `$effect`)
- **Language:** TypeScript
- **Build:** Vite
- **Package Manager:** pnpm

## Architecture

### Single-Component App
- `src/App.svelte` handles all views: home, add, edit, view, share, import, share-success
- URL-based routing via query params (`?view=add`, `?view=view&id=...`)
- Uses `window.history.pushState` for navigation
- `popstate` listener syncs UI with browser back/forward

### localStorage Reactivity
- `src/lib/localStorage.svelte.ts` provides reactive wrapper
- Uses Proxy to track property reads/writes
- `$effect` tracks listeners for cleanup
- Syncs across tabs via `storage` event listener

### Ritual Data Model
```typescript
interface Ritual {
  id: string;        // crypto.randomUUID()
  name: string;
  markdown: string;
}
```

### Markdown Format
- Each line becomes a checkbox item
- `---` delimiter switches to preformatted code block
- Checkboxes reset on each ritual view (ephemeral state)

### Sharing Mechanism
1. Serialize rituals to JSON
2. Compress with Gzip via `CompressionStream`
3. Base64 encode with URL-safe chars (`+/` → `-_`)
4. Append to URL as `?view=import&data=<encoded>`

## PWA Setup
- Service worker in `public/sw.js`
- Caches: index.html, manifest, icons
- Cache-first strategy for cached assets, network-first for others
- `beforeinstallprompt` event enables custom install UI

## Styling
- Fluid typography via [Utopia](https://utopia.fyi) CSS custom properties
- CSS variable naming: `--step-*` for type scale, `--space-*` for spacing
- Imports chain: reset → utopia → defaults → utilities → component styles

## Deployment
- Built to `dist/` directory
- Served from `/rituals` subdirectory
- Released via Minio: `mc mirror --overwrite --remove ./dist rknt/tools/rituals`