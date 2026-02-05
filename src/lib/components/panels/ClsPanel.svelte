<script lang="ts">
	import { Panel } from '$lib/components/common';
	import { clsTelegraph, settings } from '$lib/stores';
	import { getPanelName, UI_TEXTS } from '$lib/config';

	const DEFAULT_PREVIEW = 10;
	let expanded = $state(false);

	const items = $derived($clsTelegraph.items);
	const loading = $derived($clsTelegraph.loading);
	const error = $derived($clsTelegraph.error);
	const count = $derived(items.length);
	const title = $derived(getPanelName('cls', $settings.locale));
	const emptyText = $derived(UI_TEXTS[$settings.locale].empty.news);
	const t = $derived(UI_TEXTS[$settings.locale].common);
	const visibleItems = $derived(expanded ? items : items.slice(0, DEFAULT_PREVIEW));
	const hasMore = $derived(items.length > DEFAULT_PREVIEW);
	const moreCount = $derived(items.length - DEFAULT_PREVIEW);

	$effect(() => {
		// 自动加载一次
		if (!loading && items.length === 0 && !error) {
			clsTelegraph.load();
		}
	});
</script>

<Panel id="cls" {title} {count} {loading} {error}>
	{#if items.length === 0 && !loading && !error}
		<div class="empty-state">{emptyText}</div>
	{:else}
		<div class="cls-list">
			{#each visibleItems as item (item.id)}
				<article class="cls-item">
					<a
						href={item.link || 'https://www.cls.cn/telegraph'}
						target="_blank"
						rel="noopener noreferrer"
						class="cls-link"
					>
						<header class="cls-header">
							<h3 class="cls-title">{item.title}</h3>
							<span class="cls-time">{item.time}</span>
						</header>
						{#if item.summary}
							<p class="cls-summary">{item.summary}</p>
						{/if}
					</a>
				</article>
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
	.cls-list {
		display: flex;
		flex-direction: column;
	}

	.cls-item {
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
	}

	.cls-item:last-child {
		border-bottom: none;
	}

	.cls-link {
		display: block;
		text-decoration: none;
		color: inherit;
	}

	.cls-link:hover .cls-title {
		color: var(--accent);
	}

	.cls-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.cls-title {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.35;
		flex: 1;
		min-width: 0;
	}

	.cls-time {
		font-size: 0.55rem;
		color: var(--text-muted);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.cls-summary {
		font-size: 0.65rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.4;
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
		color: var(--text-muted);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>

