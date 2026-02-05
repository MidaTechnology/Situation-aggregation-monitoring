<script lang="ts">
	import { Panel, HeatmapCell } from '$lib/components/common';
	import { sectors, settings } from '$lib/stores';
	import { getPanelName, UI_TEXTS } from '$lib/config';

	const items = $derived($sectors.items);
	const loading = $derived($sectors.loading);
	const error = $derived($sectors.error);
	const title = $derived(getPanelName('heatmap', $settings.locale));
	const emptyHeatmap = $derived(UI_TEXTS[$settings.locale].empty.heatmap);
	const count = $derived(items.length);
</script>

<Panel id="heatmap" {title} {count} {loading} {error}>
	{#if items.length === 0 && !loading && !error}
		<div class="empty-state">{emptyHeatmap}</div>
	{:else}
		<div class="heatmap-grid">
			{#each items as sector (sector.symbol)}
				<HeatmapCell {sector} />
			{/each}
		</div>
	{/if}
</Panel>

<style>
	.heatmap-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.25rem;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}

	@media (max-width: 400px) {
		.heatmap-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
