<script lang="ts">
	import Modal from './Modal.svelte';
	import { settings, refresh } from '$lib/stores';
	import { PANELS, UI_TEXTS, getPanelName, type PanelId, type Locale } from '$lib/config';

	const PRESET_INTERVALS_MS = [
		1 * 60 * 1000,
		5 * 60 * 1000,
		15 * 60 * 1000,
		30 * 60 * 1000,
		60 * 60 * 1000
	] as const;

	interface Props {
		open: boolean;
		onClose: () => void;
		onReconfigure?: () => void;
		/** Called when auto-refresh toggle or interval changes, so parent can re-apply timer */
		onRefreshCallback?: () => void;
	}

	let { open = false, onClose, onReconfigure, onRefreshCallback }: Props = $props();

	let customMinutes = $state(5);
	let isCustom = $derived(
		PRESET_INTERVALS_MS.every((ms) => ms !== $refresh.autoRefreshInterval)
	);

	// Sync custom minutes from store when modal opens with a custom interval
	$effect(() => {
		if (open && isCustom) {
			customMinutes = Math.max(1, Math.min(1440, Math.round($refresh.autoRefreshInterval / 60000)));
		}
	});

	const t = $derived(UI_TEXTS[$settings.locale]);

	function handleTogglePanel(panelId: PanelId) {
		settings.togglePanel(panelId);
	}

	function handleResetPanels() {
		settings.reset();
	}

	function setLocale(locale: Locale) {
		settings.setLocale(locale);
	}

	function setTheme(theme: 'dark' | 'light') {
		settings.setTheme(theme);
	}

	function handleToggleAutoRefresh() {
		refresh.toggleAutoRefresh(onRefreshCallback);
	}

	function handleSetInterval(ms: number) {
		refresh.setAutoRefreshInterval(ms, onRefreshCallback);
	}

	function handleCustomApply() {
		const ms = Math.max(1, Math.min(1440, customMinutes)) * 60 * 1000;
		refresh.setAutoRefreshInterval(ms, onRefreshCallback);
	}

	function presetLabel(ms: number, settingsT: typeof t.settings): string {
		if (ms === 60 * 1000) return settingsT.interval1m;
		if (ms === 5 * 60 * 1000) return settingsT.interval5m;
		if (ms === 15 * 60 * 1000) return settingsT.interval15m;
		if (ms === 30 * 60 * 1000) return settingsT.interval30m;
		if (ms === 60 * 60 * 1000) return settingsT.interval1h;
		return `${ms / 60000} ${settingsT.customMinutes}`;
	}
</script>

<Modal {open} title={t.settings.title} closeLabel={t.modal.close} {onClose}>
	<div class="settings-sections">
		<section class="settings-section">
			<h3 class="section-title">{t.settings.language}</h3>
			<div class="locale-buttons">
				<button
					class="locale-btn"
					class:active={$settings.locale === 'zh'}
					onclick={() => setLocale('zh')}
				>
					中文
				</button>
				<button
					class="locale-btn"
					class:active={$settings.locale === 'en'}
					onclick={() => setLocale('en')}
				>
					English
				</button>
			</div>
		</section>

		<section class="settings-section">
			<h3 class="section-title">{t.settings.background}</h3>
			<div class="theme-buttons">
				<button
					class="theme-btn"
					class:active={$settings.theme === 'dark'}
					onclick={() => setTheme('dark')}
				>
					{t.settings.themeDark}
				</button>
				<button
					class="theme-btn"
					class:active={$settings.theme === 'light'}
					onclick={() => setTheme('light')}
				>
					{t.settings.themeLight}
				</button>
			</div>
		</section>

		<section class="settings-section">
			<h3 class="section-title">{t.settings.autoRefresh}</h3>
			<label class="panel-toggle" class:enabled={$refresh.autoRefreshEnabled}>
				<input
					type="checkbox"
					checked={$refresh.autoRefreshEnabled}
					onchange={handleToggleAutoRefresh}
				/>
				<span class="panel-name">{t.settings.autoRefresh}</span>
			</label>
			<p class="section-desc">{t.settings.autoRefreshInterval}</p>
			<div class="interval-buttons">
				{#each PRESET_INTERVALS_MS as ms}
					<button
						type="button"
						class="interval-btn"
						class:active={$refresh.autoRefreshInterval === ms && !isCustom}
						onclick={() => handleSetInterval(ms)}
					>
						{presetLabel(ms, t.settings)}
					</button>
				{/each}
			</div>
			<div class="custom-interval">
				<button
					type="button"
					class="interval-btn"
					class:active={isCustom}
					onclick={() => {
						if (isCustom) return;
						// Switch to custom: set 7 min so input shows (7 is not a preset)
						customMinutes = 7;
						handleSetInterval(7 * 60 * 1000);
					}}
				>
					{t.settings.customInterval}
				</button>
				{#if isCustom}
					<span class="custom-input-wrap">
						<input
							type="number"
							min="1"
							max="1440"
							class="custom-minutes-input"
							bind:value={customMinutes}
							onchange={handleCustomApply}
							onblur={handleCustomApply}
						/>
						<span class="custom-minutes-unit">{t.settings.customMinutes}</span>
					</span>
				{/if}
			</div>
		</section>

		<section class="settings-section">
			<h3 class="section-title">{t.settings.enabledPanels}</h3>
			<p class="section-desc">{t.settings.sectionDesc}</p>

			<div class="panels-grid">
				{#each Object.entries(PANELS) as [id, config]}
					{@const panelId = id as PanelId}
					{@const isEnabled = $settings.enabled[panelId]}
					<label class="panel-toggle" class:enabled={isEnabled}>
						<input
							type="checkbox"
							checked={isEnabled}
							onchange={() => handleTogglePanel(panelId)}
						/>
						<span class="panel-name">{getPanelName(panelId, $settings.locale)}</span>
						<span class="panel-priority">P{config.priority}</span>
					</label>
				{/each}
			</div>
		</section>

		<section class="settings-section">
			<h3 class="section-title">{t.settings.dashboard}</h3>
			{#if onReconfigure}
				<button class="reconfigure-btn" onclick={onReconfigure}>{t.settings.reconfigure}</button>
				<p class="btn-hint">{t.settings.btnHint}</p>
			{/if}
			<button class="reset-btn" onclick={handleResetPanels}>{t.settings.reset}</button>
		</section>
	</div>
</Modal>

<style>
	.settings-sections {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.settings-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.locale-buttons {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.locale-btn {
		padding: 0.4rem 0.8rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-secondary);
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.locale-btn:hover {
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-primary);
	}

	.locale-btn.active {
		border-color: var(--accent);
		background: rgba(255, 255, 255, 0.1);
	}

	.theme-buttons {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.theme-btn {
		padding: 0.4rem 0.8rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-secondary);
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.theme-btn:hover {
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-primary);
	}

	.theme-btn.active {
		border-color: var(--accent);
		background: rgba(255, 255, 255, 0.1);
		color: var(--accent);
	}

	.interval-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.interval-btn {
		padding: 0.35rem 0.6rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-secondary);
		font-size: 0.65rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.interval-btn:hover {
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-primary);
	}

	.interval-btn.active {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.1);
		color: var(--accent);
	}

	.custom-interval {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-top: 0.4rem;
	}

	.custom-input-wrap {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.custom-minutes-input {
		width: 4rem;
		padding: 0.35rem 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-primary);
		font-size: 0.65rem;
	}

	.custom-minutes-input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.custom-minutes-unit {
		font-size: 0.6rem;
		color: var(--text-muted);
	}

	.section-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		margin: 0;
	}

	.section-desc {
		font-size: 0.65rem;
		color: var(--text-muted);
		margin: 0;
	}

	.panels-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.panel-toggle {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.6rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.panel-toggle:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.panel-toggle.enabled {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.1);
	}

	.panel-toggle input {
		accent-color: var(--accent);
	}

	.panel-name {
		flex: 1;
		font-size: 0.65rem;
		color: var(--text-primary);
	}

	.panel-priority {
		font-size: 0.5rem;
		color: var(--text-muted);
		background: rgba(255, 255, 255, 0.05);
		padding: 0.1rem 0.25rem;
		border-radius: 2px;
	}

	.reconfigure-btn {
		padding: 0.5rem 1rem;
		background: rgba(0, 255, 136, 0.1);
		border: 1px solid rgba(0, 255, 136, 0.3);
		border-radius: 4px;
		color: var(--accent);
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.15s ease;
		margin-bottom: 0.25rem;
	}

	.reconfigure-btn:hover {
		background: rgba(0, 255, 136, 0.2);
	}

	.btn-hint {
		font-size: 0.6rem;
		color: var(--text-muted);
		margin: 0 0 0.75rem;
	}

	.reset-btn {
		padding: 0.5rem 1rem;
		background: rgba(255, 68, 68, 0.1);
		border: 1px solid rgba(255, 68, 68, 0.3);
		border-radius: 4px;
		color: var(--danger);
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.reset-btn:hover {
		background: rgba(255, 68, 68, 0.2);
	}
</style>
