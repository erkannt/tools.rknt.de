<script lang="ts">
	import type { GoldCard } from '../types';
	import { generateCsv, parseCsv } from '../csv';

	interface Props {
		cards: GoldCard[];
		onImport: (cards: GoldCard[]) => void;
	}

	let { cards, onImport }: Props = $props();

	const csvContent = $derived(generateCsv(cards));
	const csvUrl = $derived.by(() => `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);

	function handleCsvUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			const parsed = parseCsv(text);
			if (parsed.length) {
				onImport(parsed);
			}
		};
		reader.readAsText(file);
		// Reset the file input so the same file can be uploaded again if needed
		input.value = '';
	}
</script>

<a
	href={csvUrl}
	download={'goldcards_' + new Date().toISOString().replace(/[:.]/g, '-') + '.csv'}
	target="_blank"
	rel="noopener noreferrer external"
	role="button"
	class="btn"
>
	Export CSV
</a>

<label class="btn">
	Import CSV
	<input type="file" accept=".csv,text/csv" onchange={handleCsvUpload} />
</label>

<style>
	/* Minimalist button styling */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-xs) var(--space-s);
		line-height: 1;
		font-size: var(--step-1);
		background-color: oklch(from lightslategrey calc(l * 1.3) c h);
		border-radius: 4px;
		color: inherit;
		text-decoration: none;
		cursor: pointer;
		user-select: none;
		margin-inline-end: var(--space-l);
	}

	.btn:hover,
	.btn:focus-visible {
		outline: 2px solid lightslategrey;
		outline-offset: 2px;
	}

	/* Hide the native file input but keep it accessible */
	.btn input[type='file'] {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}
</style>
