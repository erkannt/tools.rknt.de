<script lang="ts">
	import type { WeekGroup } from '../weekGrouping';
	import { formatDate } from '../dateUtils';

	interface Props {
		byIsoWeek: WeekGroup[];
	}

	let { byIsoWeek }: Props = $props();
</script>

<h2>Log</h2>

{#each byIsoWeek as group (group.week)}
	<h3>Week {String(group.week).padStart(2, '0')}-{String(group.year)}</h3>
	<ul>
		{#each group.cards as card (card.id)}
			<li>
				<strong>{formatDate(card.date)}:</strong>
				{card.comment}
			</li>
		{/each}
	</ul>
{/each}
