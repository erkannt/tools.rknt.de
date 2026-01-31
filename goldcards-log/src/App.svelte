<script lang="ts">
	import { LocalStorage } from './lib/localStorage.svelte';
	import type { GoldCard } from './lib/types';
	import { calculateBudget } from './lib/budget';
	import { groupByIsoWeek } from './lib/weekGrouping';
	import BudgetDisplay from './lib/components/BudgetDisplay.svelte';
	import CardLogger from './lib/components/CardLogger.svelte';
	import CsvImportExport from './lib/components/CsvImportExport.svelte';
	import GoldcardLog from './lib/components/GoldcardLog.svelte';

	const goldcards = new LocalStorage<GoldCard[]>('goldcards', []);
	const sortedByDate: GoldCard[] = $derived(
		[...goldcards.current].sort((a, b) => b.date.localeCompare(a.date))
	);
	const byIsoWeek = $derived(groupByIsoWeek(sortedByDate));

	const goldcardBudget = $derived(calculateBudget(goldcards.current));

	function addGoldCard(cardData: { date: string; comment: string }) {
		const newId = crypto.randomUUID();

		// Create datetime: use selected date with current time
		const now = new Date(Date.now());
		const selectedDateStr =
			cardData.date +
			'T' +
			String(now.getHours()).padStart(2, '0') +
			':' +
			String(now.getMinutes()).padStart(2, '0') +
			':' +
			String(now.getSeconds()).padStart(2, '0') +
			'.' +
			String(now.getMilliseconds()).padStart(3, '0') +
			'Z';

		goldcards.current.push({
			id: newId,
			date: selectedDateStr,
			comment: cardData.comment
		});
	}

	function handleImport(importedCards: GoldCard[]) {
		goldcards.current = importedCards;
	}
</script>

<main class="container">
	<h1>Goldcard Log</h1>

	<BudgetDisplay loggedCount={goldcards.current.length} budget={goldcardBudget} />

	<CardLogger onAddCard={addGoldCard} />

	<CsvImportExport cards={goldcards.current} onImport={handleImport} />

	<GoldcardLog {byIsoWeek} />
</main>

<style>
	main {
		margin-top: 6rem;
	}
</style>
