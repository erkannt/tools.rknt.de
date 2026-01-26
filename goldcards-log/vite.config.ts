import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	plugins: [svelte()],
	root: '.',
	resolve: {
		alias: {
			$lib: resolve(__dirname, './src/lib')
		}
	},
	build: {
		outDir: 'dist'
	}
});
