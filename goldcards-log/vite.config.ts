/// <reference types="vitest" />
/// <reference types="vitest" />
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [svelte()],
	root: '.',
	base: './',
	test: {
		environment: 'node'
	}
});
