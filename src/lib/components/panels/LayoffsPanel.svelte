<script lang="ts">
	import { Panel } from '$lib/components/common';
	import { timeAgo } from '$lib/utils';
	import { settings } from '$lib/stores';
	import { getPanelName, UI_TEXTS } from '$lib/config';

	interface Layoff {
		company: string;
		count?: string | number;
		title: string;
		date: string;
		url?: string;
	}

	interface Props {
		layoffs?: Layoff[];
		loading?: boolean;
		error?: string | null;
		onRetry?: () => void;
	}

	let { layoffs = [], loading = false, error = null, onRetry }: Props = $props();
	let expanded = $state(false);

	const DEFAULT_PREVIEW = 5;
	const count = $derived(layoffs.length);
	const title = $derived(getPanelName('layoffs', $settings.locale));
	const emptyLayoffs = $derived(UI_TEXTS[$settings.locale].empty.layoffs);
	const t = $derived(UI_TEXTS[$settings.locale].common);
	const visibleList = $derived(expanded ? layoffs : layoffs.slice(0, DEFAULT_PREVIEW));
	const hasMore = $derived(layoffs.length > DEFAULT_PREVIEW);
	const moreCount = $derived(layoffs.length - DEFAULT_PREVIEW);
</script>

<Panel id="layoffs" {title} {count} {loading} {error} {onRetry}>
	{#if layoffs.length === 0 && !loading && !error}
		<div class="empty-state">{emptyLayoffs}</div>
	{:else}
		<div class="layoffs-list">
			{#each visibleList as layoff, i (layoff.company + (layoff.url ?? '') + i)}
				{#if layoff.url}
					<a
						href={layoff.url}
						target="_blank"
						rel="noopener noreferrer"
						class="layoff-item layoff-link"
					>
						<div class="layoff-company">{layoff.company}</div>
						{#if layoff.count}
							<div class="layoff-count">
								{typeof layoff.count === 'string'
									? parseInt(layoff.count).toLocaleString()
									: layoff.count.toLocaleString()} jobs
							</div>
						{/if}
						<div class="layoff-meta">
							<span class="headline">{layoff.title}</span>
							<span class="time">{timeAgo(layoff.date)}</span>
						</div>
					</a>
				{:else}
					<div class="layoff-item">
						<div class="layoff-company">{layoff.company}</div>
						{#if layoff.count}
							<div class="layoff-count">
								{typeof layoff.count === 'string'
									? parseInt(layoff.count).toLocaleString()
									: layoff.count.toLocaleString()} jobs
							</div>
						{/if}
						<div class="layoff-meta">
							<span class="headline">{layoff.title}</span>
							<span class="time">{timeAgo(layoff.date)}</span>
						</div>
					</div>
				{/if}
			{/each}
		</div>
		{#if hasMore}
			<button type="button" class="show-more-btn" onclick={() => (expanded = !expanded)}>
				{expanded ? t.showLess : t.showMore}
				{#if !expanded}<span class="show-more-count">({moreCount})</span>{/if}
			</button>
		{/if}
	{/if}
</Panel>

<style>
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

	.layoffs-list {
		display: flex;
		flex-direction: column;
	}

	.layoff-item {
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
	}

	.layoff-item:last-child {
		border-bottom: none;
	}

	.layoff-link {
		display: block;
		text-decoration: none;
		color: inherit;
	}

	.layoff-link:hover {
		background: var(--panel-hover, rgba(255 255 255 / 0.04));
	}

	.layoff-company {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.15rem;
	}

	.layoff-count {
		font-size: 0.65rem;
		font-weight: 500;
		color: var(--danger);
		margin-bottom: 0.2rem;
	}

	.layoff-meta {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.headline {
		font-size: 0.6rem;
		color: var(--text-secondary);
		line-height: 1.3;
		flex: 1;
	}

	.time {
		font-size: 0.55rem;
		color: var(--text-muted);
		white-space: nowrap;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
