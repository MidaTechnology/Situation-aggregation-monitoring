<script lang="ts">
	import { Panel } from '$lib/components/common';
	import AISettingsModal from '$lib/components/modals/AISettingsModal.svelte';
	import { settings } from '$lib/stores';
	import { getPanelName, UI_TEXTS } from '$lib/config';
	import { getStructuredSummary } from '$lib/analysis/ai-context';
	import { generateAISummary, isAIConfigured } from '$lib/api';
	import type { AIModuleContext } from '$lib/analysis/ai-context';

	interface Props {
		context?: AIModuleContext | null;
		loading?: boolean;
		error?: string | null;
		refreshTick?: number;
	}

	let { context = null, loading = false, error = null, refreshTick = 0 }: Props = $props();

	let aiSummary = $state('');
	let aiLoading = $state(false);
	let aiError = $state<string | null>(null);
	let settingsModalOpen = $state(false);
	let lastAutoTick = $state<number | null>(null);
	let lastLocale = $state($settings.locale);

	const title = $derived(getPanelName('aiInsights', $settings.locale));
	const empty = $derived(UI_TEXTS[$settings.locale].empty.aiInsights);
	const aiT = $derived(UI_TEXTS[$settings.locale].aiInsights);
	const summaryBullets = $derived(context ? getStructuredSummary(context, $settings.locale) : []);
	const hasContent = $derived(
		context !== null && (context.messageCount > 0 || summaryBullets.length > 0)
	);
	const count = $derived(context?.messageCount ?? 0);
	// 有 key 且有内容（消息或规则摘要）即可生成
	const canGenerate = $derived(
		isAIConfigured() &&
			context !== null &&
			(context.messageCount > 0 || summaryBullets.length > 0)
	);

	// Auto-generate summary on each refresh tick (manual or silent)
	$effect(() => {
		if (!canGenerate || !context) return;
		if (aiLoading) return;
		if (lastAutoTick === refreshTick) return;
		lastAutoTick = refreshTick;
		handleGenerate();
	});

	// Regenerate summary when locale changes
	$effect(() => {
		if (lastLocale === $settings.locale) return;
		lastLocale = $settings.locale;
		aiSummary = '';
		aiError = null;
		lastAutoTick = null;
		if (canGenerate && context && !aiLoading) {
			handleGenerate();
		}
	});

	async function handleGenerate() {
		if (!context || aiLoading) return;
		aiLoading = true;
		aiError = null;
		aiSummary = '';
		try {
			const { content } = await generateAISummary(context, $settings.locale);
			aiSummary = content;
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			// 跨域或网络错误时给出可操作提示
			aiError =
				msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')
					? aiT.requestFailed
					: msg;
		} finally {
			aiLoading = false;
		}
	}

	/** Split bullet text into segments so +/- percentages can be colored (up/down) */
	function segmentBullet(text: string): Array<{ type: 'text' | 'up' | 'down'; value: string }> {
		const segments: Array<{ type: 'text' | 'up' | 'down'; value: string }> = [];
		const re = /([+-]?\d+(?:\.\d+)?%)/g;
		let lastEnd = 0;
		let m: RegExpExecArray | null;
		while ((m = re.exec(text)) !== null) {
			if (m.index > lastEnd) {
				segments.push({ type: 'text', value: text.slice(lastEnd, m.index) });
			}
			const value = m[1];
			const isUp = value.startsWith('+') || (!value.startsWith('-') && parseFloat(value) >= 0);
			segments.push({ type: isUp ? 'up' : 'down', value });
			lastEnd = m.index + value.length;
		}
		if (lastEnd < text.length) {
			segments.push({ type: 'text', value: text.slice(lastEnd) });
		}
		return segments.length > 0 ? segments : [{ type: 'text', value: text }];
	}
</script>

<Panel id="aiInsights" {title} {count} {loading} {error}>
	{#snippet actions()}
		<button
			type="button"
			class="ai-settings-btn"
			aria-label={aiT.settingsLabel}
			title={aiT.settingsLabel}
			onclick={() => (settingsModalOpen = true)}
		>
			⚙️
		</button>
	{/snippet}
	{#if !context && !loading && !error}
		<div class="empty-state">{empty}</div>
	{:else if !hasContent && !loading && !error}
		<div class="empty-state">{empty}</div>
	{:else if context}
		<div class="ai-insights-content">
			<div class="stats-row">
				<span class="stat">
					{aiT.statsEnabledPanels.replace('{n}', String(context.enabledPanelIds.length))}
				</span>
				<span class="stat">{aiT.statsMessages.replace('{n}', String(context.messageCount))}</span>
				{#if context.alertsCount > 0}
					<span class="stat stat-alerts">
						{aiT.statsAlerts.replace('{n}', String(context.alertsCount))}
					</span>
				{/if}
			</div>

			{#if summaryBullets.length > 0}
				<div class="section">
					<div class="section-title">{aiT.summaryTitle}</div>
					<ul class="summary-list">
						{#each summaryBullets as bullet}
							<li class="summary-bullet">
								{#each segmentBullet(bullet) as seg}
									{#if seg.type === 'text'}
										{seg.value}
									{:else}
										<span class="summary-pct" class:up={seg.type === 'up'} class:down={seg.type === 'down'}>{seg.value}</span>
									{/if}
								{/each}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<div class="section ai-summary-section">
				<div class="section-title">{aiT.aiSummaryTitle}</div>
				{#if canGenerate}
					{#if aiLoading}
						<p class="ai-loading">{aiT.generating}</p>
					{:else if aiError}
						<p class="ai-error">{aiError}</p>
						<button type="button" class="generate-btn" onclick={handleGenerate}>{aiT.retry}</button>
					{:else if aiSummary}
						<div class="ai-summary-text">{aiSummary}</div>
						<button type="button" class="generate-btn secondary" onclick={handleGenerate}>
							{aiT.regenerate}
						</button>
					{:else}
						<button type="button" class="generate-btn" onclick={handleGenerate} disabled={aiLoading}>
							{aiT.generate}
						</button>
					{/if}
				{:else}
					<p class="placeholder-text">
						{isAIConfigured() ? aiT.placeholderNeedData : aiT.placeholderNeedKey}
					</p>
				{/if}
			</div>
		</div>
	{:else}
		<div class="empty-state">{empty}</div>
	{/if}
</Panel>

<AISettingsModal
	open={settingsModalOpen}
	onClose={() => (settingsModalOpen = false)}
/>

<style>
	.ai-insights-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.stats-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-size: 0.6rem;
		color: var(--text-secondary);
	}

	.stat {
		padding: 0.2rem 0.4rem;
		background: rgba(255, 255, 255, 0.04);
		border-radius: 4px;
	}

	.stat-alerts {
		color: var(--warning);
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

	.summary-list {
		margin: 0;
		padding-left: 1rem;
		font-size: 0.65rem;
		line-height: 1.5;
		color: var(--text-primary);
	}

	.summary-bullet {
		margin-bottom: 0.2rem;
	}

	.summary-pct {
		font-variant-numeric: tabular-nums;
		font-weight: 500;
	}

	.summary-pct.up {
		color: var(--success);
	}

	.summary-pct.down {
		color: var(--danger);
	}

	.ai-summary-section .placeholder-text {
		font-size: 0.6rem;
		color: var(--text-muted);
		margin: 0;
	}

	.generate-btn {
		margin-top: 0.4rem;
		padding: 0.35rem 0.6rem;
		font-size: 0.65rem;
		color: var(--accent);
		background: rgba(var(--accent-rgb), 0.08);
		border: 1px solid var(--border);
		border-radius: 4px;
		cursor: pointer;
	}

	.generate-btn:hover:not(:disabled) {
		background: rgba(var(--accent-rgb), 0.12);
		border-color: var(--accent);
	}

	.generate-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.generate-btn.secondary {
		margin-top: 0.5rem;
		font-size: 0.6rem;
	}

	.ai-loading {
		font-size: 0.65rem;
		color: var(--text-muted);
		margin: 0;
	}

	.ai-error {
		font-size: 0.65rem;
		color: var(--danger);
		margin: 0;
	}

	.ai-summary-text {
		font-size: 0.65rem;
		line-height: 1.55;
		color: var(--text-primary);
		white-space: pre-wrap;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}

	.ai-settings-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 0.25rem;
		font-size: 0.85rem;
		line-height: 1;
		border-radius: 4px;
		opacity: 0.7;
		transition: opacity 0.15s, color 0.15s;
	}

	.ai-settings-btn:hover {
		opacity: 1;
		color: var(--text-secondary);
	}
</style>
