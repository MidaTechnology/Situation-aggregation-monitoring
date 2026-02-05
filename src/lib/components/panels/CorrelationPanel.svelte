<script lang="ts">
	import { Panel, Badge } from '$lib/components/common';
	import { settings } from '$lib/stores';
	import { getPanelName, UI_TEXTS } from '$lib/config';
	import { analyzeCorrelations } from '$lib/analysis/correlation';
	import type { NewsItem } from '$lib/types';

	interface Props {
		news?: NewsItem[];
		loading?: boolean;
		error?: string | null;
	}

	let { news = [], loading = false, error = null }: Props = $props();

	const analysis = $derived(analyzeCorrelations(news));
	const title = $derived(getPanelName('correlation', $settings.locale));
	const empty = $derived(UI_TEXTS[$settings.locale].empty);
	const tagsT = $derived(UI_TEXTS[$settings.locale].tags);
	const corrT = $derived(UI_TEXTS[$settings.locale].correlation);
	const count = $derived(news.length > 0 && analysis ? 1 : 0);
	function levelLabel(l: string): string {
		return tagsT.correlationLevel[l] ?? l.toUpperCase();
	}

	function getLevelVariant(level: string): 'default' | 'warning' | 'danger' | 'success' | 'info' {
		switch (level) {
			case 'high':
				return 'danger';
			case 'elevated':
				return 'warning';
			case 'surging':
				return 'danger';
			case 'rising':
				return 'warning';
			default:
				return 'default';
		}
	}

	function getMomentumClass(momentum: string): string {
		switch (momentum) {
			case 'surging':
				return 'signal-strong';
			case 'rising':
				return 'signal-medium';
			default:
				return 'signal-weak';
		}
	}

	function getDirectionArrow(delta: number): string {
		if (delta > 0) return '↑';
		if (delta < 0) return '↓';
		return '→';
	}
</script>

<Panel id="correlation" {title} {count} {loading} {error}>
	{#if news.length === 0 && !loading && !error}
		<div class="empty-state">{empty.correlation}</div>
	{:else if analysis}
		<div class="correlation-content">
			{#if analysis.emergingPatterns.length > 0}
				<div class="section">
				<div class="section-title">{corrT.emergingPatterns}</div>
					{#each analysis.emergingPatterns.slice(0, 3) as pattern}
						<div class="pattern-item">
							<div class="pattern-header">
								<span class="pattern-topic">{pattern.name}</span>
								<Badge
									text={levelLabel(pattern.level)}
									variant={getLevelVariant(pattern.level)}
								/>
							</div>
							<div class="pattern-sources">
								{pattern.sources.slice(0, 3).join(' · ')} ({corrT.items.replace('{n}', String(pattern.count))})
							</div>
						</div>
					{/each}
				</div>
			{/if}

			{#if analysis.momentumSignals.length > 0}
				<div class="section">
				<div class="section-title">{corrT.momentumSignals}</div>
					{#each analysis.momentumSignals.slice(0, 3) as signal}
						<div class="signal-item {getMomentumClass(signal.momentum)}">
							<span class="signal-topic">{signal.name}</span>
							<span
								class="signal-direction"
								class:up={signal.delta > 0}
								class:down={signal.delta < 0}
							>
								{getDirectionArrow(signal.delta)}
								{signal.current}
							</span>
						</div>
					{/each}
				</div>
			{/if}

			{#if analysis.crossSourceCorrelations.length > 0}
				<div class="section">
				<div class="section-title">{corrT.crossSourceLinks}</div>
					{#each analysis.crossSourceCorrelations.slice(0, 3) as corr}
						<div class="correlation-item">
							<div class="correlation-sources">
								{corr.sources.slice(0, 2).join(' ↔ ')}
							</div>
							<div class="correlation-topic">
								{corr.name} ({corrT.sources.replace('{n}', String(corr.sourceCount))})
							</div>
						</div>
					{/each}
				</div>
			{/if}

			{#if analysis.predictiveSignals.length > 0}
				<div class="section">
				<div class="section-title">{corrT.predictiveSignals}</div>
					{#each analysis.predictiveSignals.slice(0, 2) as signal}
						<div class="predictive-item">
							<div class="predictive-pattern">{signal.prediction}</div>
							<div class="predictive-confidence">
								{corrT.confidence}: {Math.round(signal.confidence * 100)}%
							</div>
						</div>
					{/each}
				</div>
			{/if}

			{#if analysis.emergingPatterns.length === 0 && analysis.momentumSignals.length === 0}
				<div class="empty-state">{empty.noPatterns}</div>
			{/if}
		</div>
	{:else}
		<div class="empty-state">{empty.noPatterns}</div>
	{/if}
</Panel>

<style>
	.correlation-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section {
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border);
	}

	.section:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.section-title {
		font-size: 0.6rem;
		font-weight: 600;
		color: var(--accent);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.4rem;
	}

	.pattern-item {
		padding: 0.3rem 0;
	}

	.pattern-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.2rem;
	}

	.pattern-topic {
		font-size: 0.65rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.pattern-sources {
		font-size: 0.55rem;
		color: var(--text-muted);
	}

	.signal-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.25rem 0.4rem;
		margin: 0.2rem 0;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.02);
	}

	.signal-item.signal-strong {
		background: rgba(255, 165, 0, 0.1);
		border-left: 2px solid var(--warning);
	}

	.signal-item.signal-medium {
		background: rgba(68, 255, 136, 0.05);
		border-left: 2px solid var(--success);
	}

	.signal-topic {
		font-size: 0.6rem;
		color: var(--text-primary);
	}

	.signal-direction {
		font-size: 0.6rem;
		font-weight: 600;
	}

	.signal-direction.up {
		color: var(--success);
	}

	.signal-direction.down {
		color: var(--danger);
	}

	.correlation-item {
		padding: 0.25rem 0;
	}

	.correlation-sources {
		font-size: 0.6rem;
		color: var(--text-secondary);
	}

	.correlation-topic {
		font-size: 0.55rem;
		color: var(--text-muted);
	}

	.predictive-item {
		padding: 0.3rem 0;
	}

	.predictive-pattern {
		font-size: 0.6rem;
		color: var(--text-primary);
	}

	.predictive-confidence {
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
