<script lang="ts">
	import { Panel } from '$lib/components/common';
	import { timeAgo } from '$lib/utils';
	import { settings } from '$lib/stores';
	import { UI_TEXTS, type PanelId } from '$lib/config';
	import type { NewsItem } from '$lib/types';

	interface SituationConfig {
		title: string;
		subtitle: string;
		criticalKeywords?: string[];
	}

	interface Props {
		panelId: PanelId;
		config: SituationConfig;
		news?: NewsItem[];
		loading?: boolean;
		error?: string | null;
	}

	let { panelId, config, news = [], loading = false, error = null }: Props = $props();
	let expanded = $state(false);

	const DEFAULT_PREVIEW = 4;
	const MAX_ITEMS = 8;
	const visibleNews = $derived(
		expanded ? news.slice(0, MAX_ITEMS) : news.slice(0, DEFAULT_PREVIEW)
	);
	const hasMore = $derived(news.length > DEFAULT_PREVIEW);
	const moreCount = $derived(Math.min(news.length - DEFAULT_PREVIEW, MAX_ITEMS - DEFAULT_PREVIEW));
	const t = $derived(UI_TEXTS[$settings.locale].common);

	type ThreatLevelKey = 'critical' | 'elevated' | 'monitoring';

	function calculateThreatLevel(
		newsItems: NewsItem[],
		criticalKeywords: string[] = []
	): { level: string; textKey: ThreatLevelKey } {
		if (newsItems.length === 0) {
			return { level: 'monitoring', textKey: 'monitoring' };
		}

		const now = Date.now();
		const recentNews = newsItems.filter((n) => {
			const hoursSince = (now - n.timestamp) / (1000 * 60 * 60);
			return hoursSince < 24;
		});

		const hasCritical = newsItems.some((n) =>
			criticalKeywords.some((k) => n.title.toLowerCase().includes(k))
		);

		if (hasCritical || recentNews.length >= 3) {
			return { level: 'critical', textKey: 'critical' };
		}
		if (recentNews.length >= 1) {
			return { level: 'elevated', textKey: 'elevated' };
		}
		return { level: 'monitoring', textKey: 'monitoring' };
	}

	const threatLevel = $derived(calculateThreatLevel(news, config.criticalKeywords));
	const threatStatusText = $derived(UI_TEXTS[$settings.locale].status[threatLevel.textKey]);
	const emptySituation = $derived(UI_TEXTS[$settings.locale].empty.situation);
	const count = $derived(news.length);
</script>

<Panel
	id={panelId}
	title={config.title}
	{count}
	status={threatStatusText}
	statusClass={threatLevel.level}
	{loading}
	{error}
>
	<div class="situation-content">
		<div class="situation-header">
			<div class="situation-title">{config.title}</div>
			<div class="situation-subtitle">{config.subtitle}</div>
		</div>

		{#if news.length === 0 && !loading && !error}
			<div class="empty-state">{emptySituation}</div>
		{:else}
			<div class="situation-news">
				{#each visibleNews as item (item.id)}
					<div class="situation-item">
						<a href={item.link} target="_blank" rel="noopener noreferrer" class="headline">
							{item.title}
						</a>
						<div class="meta">{item.source} · {timeAgo(item.timestamp)}</div>
					</div>
				{/each}
			</div>
			{#if hasMore}
				<button type="button" class="show-more-btn" onclick={() => (expanded = !expanded)}>
					{expanded ? t.showLess : t.showMore}
					{#if !expanded}<span class="show-more-count">({moreCount})</span>{/if}
				</button>
			{/if}
		{/if}
	</div>
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

	.situation-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.situation-header {
		text-align: center;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border);
	}

	.situation-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.situation-subtitle {
		font-size: 0.6rem;
		color: var(--text-secondary);
		margin-top: 0.1rem;
	}

	.situation-news {
		display: flex;
		flex-direction: column;
	}

	.situation-item {
		padding: 0.4rem 0;
		border-bottom: 1px solid var(--border);
	}

	.situation-item:last-child {
		border-bottom: none;
	}

	.headline {
		display: block;
		font-size: 0.65rem;
		color: var(--text-primary);
		text-decoration: none;
		line-height: 1.35;
	}

	.headline:hover {
		color: var(--accent);
	}

	.meta {
		font-size: 0.55rem;
		color: var(--text-muted);
		margin-top: 0.2rem;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
