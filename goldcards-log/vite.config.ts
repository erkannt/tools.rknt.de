import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	plugins: [svelte()],
	root: '.',
	base: './',
	resolve: {
		alias: {
			$lib: resolve(__dirname, './src/lib')
		}
	}
});
