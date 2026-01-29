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
	class="secondary"
>
	Download as CSV
</a>
<label>
	Import CSV (overwrites current log)
	<input type="file" accept=".csv,text/csv" onchange={handleCsvUpload} value="Import" />
</label>
