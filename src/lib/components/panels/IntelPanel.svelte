<script lang="ts">
	import { Panel, Badge } from '$lib/components/common';
	import { getRelativeTime } from '$lib/utils';
	import { intelNews, settings } from '$lib/stores';
	import { getPanelName, UI_TEXTS } from '$lib/config';
	import type { NewsItem } from '$lib/types';

	type SourceType = 'osint' | 'govt' | 'think-tank' | 'defense' | 'regional' | 'cyber';

	interface IntelItem {
		id: string;
		title: string;
		link: string;
		source: string;
		sourceType: SourceType;
		regions: string[];
		topics: string[];
		pubDate?: string;
		isPriority?: boolean;
	}

	// Destructure store state for cleaner access
	const { items: storeItems, loading, error } = $derived($intelNews);
	const emptyIntel = $derived(UI_TEXTS[$settings.locale].empty.intel);

	// Infer source type from source name
	function inferSourceType(source: string): SourceType {
		const s = source.toLowerCase();
		if (s.includes('cisa') || s.includes('krebs') || s.includes('cyber')) return 'cyber';
		if (s.includes('bellingcat')) return 'osint';
		if (s.includes('defense') || s.includes('war') || s.includes('military')) return 'defense';
		if (s.includes('diplomat') || s.includes('monitor')) return 'regional';
		if (s.includes('white house') || s.includes('fed') || s.includes('sec') || s.includes('dod'))
			return 'govt';
		return 'think-tank';
	}

	// Transform NewsItem to IntelItem
	function transformToIntelItem(item: NewsItem): IntelItem {
		return {
			id: item.id,
			title: item.title,
			link: item.link,
			source: item.source,
			sourceType: inferSourceType(item.source),
			regions: item.region ? [item.region] : [],
			topics: item.topics || [],
			pubDate: item.pubDate,
			isPriority: item.isAlert
		};
	}

	const DEFAULT_PREVIEW = 5;
	let expanded = $state(false);

	const items = $derived(storeItems.map(transformToIntelItem));
	const count = $derived(items.length);
	const title = $derived(getPanelName('intel', $settings.locale));
	const t = $derived(UI_TEXTS[$settings.locale].common);
	const tagsT = $derived(UI_TEXTS[$settings.locale].tags);
	const visibleItems = $derived(expanded ? items : items.slice(0, DEFAULT_PREVIEW));
	function sourceTypeLabel(key: string): string {
		return tagsT.intelSourceType[key] ?? key.toUpperCase();
	}
	function regionLabel(key: string): string {
		return tagsT.intelRegion[key] ?? key;
	}
	function topicLabel(key: string): string {
		return tagsT.intelTopic[key] ?? key;
	}
	const hasMore = $derived(items.length > DEFAULT_PREVIEW);
	const moreCount = $derived(items.length - DEFAULT_PREVIEW);

	type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

	const SOURCE_BADGE_VARIANTS: Record<string, BadgeVariant> = {
		osint: 'info',
		govt: 'warning',
		cyber: 'danger'
	};

	function getSourceBadgeVariant(type: string): BadgeVariant {
		return SOURCE_BADGE_VARIANTS[type] ?? 'default';
	}
</script>

<Panel id="intel" {title} {count} {loading} {error}>
	{#if items.length === 0 && !loading && !error}
		<div class="empty-state">{emptyIntel}</div>
	{:else}
		<div class="intel-list">
			{#each visibleItems as item (item.id)}
				<div class="intel-item" class:priority={item.isPriority}>
					<div class="intel-header">
						<span class="intel-source">{item.source}</span>
						<div class="intel-tags">
							<Badge
								text={sourceTypeLabel(item.sourceType)}
								variant={getSourceBadgeVariant(item.sourceType)}
							/>
							{#each item.regions.slice(0, 2) as region}
								<Badge text={regionLabel(region)} variant="info" />
							{/each}
							{#each item.topics.slice(0, 2) as topic}
								<Badge text={topicLabel(topic)} />
							{/each}
						</div>
					</div>
					<a href={item.link} target="_blank" rel="noopener noreferrer" class="intel-title">
						{item.title}
					</a>
					{#if item.pubDate}
						<div class="intel-meta">
							<span>{getRelativeTime(item.pubDate)}</span>
						</div>
					{/if}
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

	.intel-list {
		display: flex;
		flex-direction: column;
	}

	.intel-item {
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
	}

	.intel-item:last-child {
		border-bottom: none;
	}

	.intel-item.priority {
		background: rgba(255, 165, 0, 0.08);
		margin: 0 -0.5rem;
		padding: 0.5rem;
		border-radius: 4px;
		border: 1px solid rgba(255, 165, 0, 0.2);
	}

	.intel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.3rem;
		gap: 0.5rem;
	}

	.intel-source {
		font-size: 0.55rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.intel-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem;
	}

	.intel-title {
		display: block;
		font-size: 0.65rem;
		color: var(--text-primary);
		text-decoration: none;
		line-height: 1.35;
	}

	.intel-title:hover {
		color: var(--accent);
	}

	.intel-meta {
		margin-top: 0.25rem;
		font-size: 0.55rem;
		color: var(--text-muted);
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
