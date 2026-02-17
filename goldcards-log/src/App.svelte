<script lang="ts">
	import { LocalStorage } from './lib/localStorage.svelte';
	import type { GoldCard, BudgetAdjustment } from './lib/types';
	import { calculateBudget } from './lib/budget';
	import { groupByIsoWeek } from './lib/weekGrouping';
	import BudgetDisplay from './lib/components/BudgetDisplay.svelte';
	import CardLogger from './lib/components/CardLogger.svelte';
	import CsvImportExport from './lib/components/CsvImportExport.svelte';
	import GoldcardLog from './lib/components/GoldcardLog.svelte';

	const goldcards = new LocalStorage<GoldCard[]>('goldcards', []);
	const budgetAdjustments = new LocalStorage<BudgetAdjustment[]>('budgetAdjustments', []);
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

	function addBudgetAdjustment(data: { adjustment: number; comment: string }) {
		const newId = crypto.randomUUID();
		const now = new Date(Date.now());
		const dateStr =
			now.getFullYear() +
			'-' +
			String(now.getMonth() + 1).padStart(2, '0') +
			'-' +
			String(now.getDate()).padStart(2, '0') +
			'T' +
			String(now.getHours()).padStart(2, '0') +
			':' +
			String(now.getMinutes()).padStart(2, '0') +
			':' +
			String(now.getSeconds()).padStart(2, '0') +
			'.' +
			String(now.getMilliseconds()).padStart(3, '0') +
			'Z';
		budgetAdjustments.current.push({
			id: newId,
			date: dateStr,
			...data
		});
	}
</script>

<main class="stack">
	<section class="stack">
		<h1>Log Goldcards</h1>
		<CardLogger onAddCard={addGoldCard} />
		<BudgetDisplay
			loggedCount={goldcards.current.length}
			budget={goldcardBudget}
			adjustments={budgetAdjustments.current}
			onAddAdjustment={addBudgetAdjustment}
		/>
	</section>

	<section>
		<h2>Export/Import</h2>
		<CsvImportExport cards={goldcards.current} onImport={handleImport} />
	</section>

	<section>
		<h2>Log</h2>
		<GoldcardLog {byIsoWeek} />
	</section>
</main>

<style>
	main {
		margin-top: 6rem;
	}

	h2 {
		border-top: 2px solid black;
		padding-block-start: var(--space-xs);
	}
</style>
