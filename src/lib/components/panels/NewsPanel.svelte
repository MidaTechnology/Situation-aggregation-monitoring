<script lang="ts">
	import { Panel, NewsItem } from '$lib/components/common';
	import type { NewsCategory } from '$lib/types';
	import type { PanelId } from '$lib/config';
	import {
		politicsNews,
		techNews,
		financeNews,
		govNews,
		aiNews,
		intelNews,
		settings
	} from '$lib/stores';
	import { UI_TEXTS } from '$lib/config';

	const DEFAULT_PREVIEW = 5;
	const MAX_ITEMS = 15;

	interface Props {
		category: NewsCategory;
		panelId: PanelId;
		title: string;
		onRetry?: () => void;
	}

	let { category, panelId, title, onRetry }: Props = $props();
	let expanded = $state(false);

	const emptyNews = $derived(UI_TEXTS[$settings.locale].empty.news);
	const t = $derived(UI_TEXTS[$settings.locale].common);

	const categoryStores = {
		politics: politicsNews,
		tech: techNews,
		finance: financeNews,
		gov: govNews,
		ai: aiNews,
		intel: intelNews
	};

	const categoryStore = $derived(categoryStores[category]);
	const items = $derived($categoryStore.items);
	const loading = $derived($categoryStore.loading);
	const error = $derived($categoryStore.error);
	const count = $derived(items.length);
	const visibleItems = $derived(
		expanded ? items.slice(0, MAX_ITEMS) : items.slice(0, DEFAULT_PREVIEW)
	);
	const hasMore = $derived(items.length > DEFAULT_PREVIEW);
	const moreCount = $derived(Math.min(items.length - DEFAULT_PREVIEW, MAX_ITEMS - DEFAULT_PREVIEW));
</script>

<Panel id={panelId} {title} {count} {loading} {error} {onRetry}>
	{#if items.length === 0 && !loading && !error}
		<div class="empty-state">{emptyNews}</div>
	{:else}
		<div class="news-list">
			{#each visibleItems as item (item.id)}
				<NewsItem {item} />
			{/each}
		</div>
		{#if hasMore}
			<button type="button" class="show-more-btn" onclick={() => (expanded = !expanded)}>
				{expanded ? t.showLess : t.showMore}
				{#if !expanded}
					<span class="show-more-count">({moreCount})</span>
				{/if}
			</button>
		{/if}
	{/if}
</Panel>

<style>
	.news-list {
		display: flex;
		flex-direction: column;
	}

	.show-more-btn {
		margin-top: 0.5rem;
		padding: 0.35rem 0.5rem;
		font-size: 0.65rem;
		color: var(--accent);
		background: none;
		border: 1px solid var(--border);
		border-radius: 4px;
		cursor: pointer;
		width: 100%;
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.show-more-btn:hover {
		background: rgba(var(--accent-rgb), 0.08);
		border-color: var(--accent);
	}

	.show-more-count {
		color: var(--text-muted);
		font-weight: 500;
		margin-left: 0.25rem;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
