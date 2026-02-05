<script lang="ts">
	import { Panel } from '$lib/components/common';
	import { settings } from '$lib/stores';
	import { getPanelName, UI_TEXTS } from '$lib/config';

	interface Prediction {
		id: string;
		question: string;
		yes: number;
		volume: number | string;
		url?: string;
	}

	interface Props {
		predictions?: Prediction[];
		loading?: boolean;
		error?: string | null;
		onRetry?: () => void;
	}

	let { predictions = [], loading = false, error = null, onRetry }: Props = $props();

	const DEFAULT_PREVIEW = 10;
	let expanded = $state(false);

	const count = $derived(predictions.length);
	const title = $derived(getPanelName('polymarket', $settings.locale));
	const emptyPolymarket = $derived(UI_TEXTS[$settings.locale].empty.polymarket);
	const t = $derived(UI_TEXTS[$settings.locale].common);
	const visiblePredictions = $derived(
		expanded ? predictions : predictions.slice(0, DEFAULT_PREVIEW)
	);
	const hasMore = $derived(predictions.length > DEFAULT_PREVIEW);
	const moreCount = $derived(predictions.length - DEFAULT_PREVIEW);

	function formatVolume(v: number | string): string {
		if (typeof v === 'string') {
			if (v === '—' || !v) return v || '—';
			const n = parseFloat(v);
			if (Number.isNaN(n) || n <= 0) return '—';
			return '$' + v;
		}
		if (v == null || v <= 0) return '—';
		if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
		if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
		return '$' + v.toFixed(0);
	}
</script>

<Panel id="polymarket" {title} {count} {loading} {error} {onRetry}>
	{#if predictions.length === 0 && !loading && !error}
		<div class="empty-state">{emptyPolymarket}</div>
	{:else}
		<div class="predictions-list">
			{#each visiblePredictions as pred (pred.id)}
				<div class="prediction-item">
					<div class="prediction-info">
						<div class="prediction-question">
							{#if pred.url}
								<a href={pred.url} target="_blank" rel="noopener noreferrer" class="prediction-link"
									>{pred.question}</a
								>
							{:else}
								{pred.question}
							{/if}
						</div>
						<div class="prediction-volume">Vol: {formatVolume(pred.volume)}</div>
					</div>
					<div class="prediction-odds">
						<span class="prediction-yes">{pred.yes}%</span>
					</div>
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
	.predictions-list {
		display: flex;
		flex-direction: column;
	}

	.prediction-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
	}

	.prediction-item:last-child {
		border-bottom: none;
	}

	.prediction-info {
		flex: 1;
		min-width: 0;
	}

	.prediction-question {
		font-size: 0.65rem;
		color: var(--text-primary);
		line-height: 1.3;
		margin-bottom: 0.2rem;
	}

	.prediction-link {
		color: inherit;
		text-decoration: none;
	}

	.prediction-link:hover {
		text-decoration: underline;
		color: var(--accent);
	}

	.prediction-volume {
		font-size: 0.55rem;
		color: var(--text-muted);
	}

	.prediction-odds {
		margin-left: 0.5rem;
	}

	.prediction-yes {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--success);
		font-variant-numeric: tabular-nums;
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
