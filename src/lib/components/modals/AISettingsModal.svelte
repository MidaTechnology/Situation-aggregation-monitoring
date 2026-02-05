<script lang="ts">
	import Modal from './Modal.svelte';
	import { get } from 'svelte/store';
	import { aiSettings, settings } from '$lib/stores';
	import { AI_PROVIDERS, getProvider, UI_TEXTS } from '$lib/config';
	import type { AIProviderId } from '$lib/config/ai-providers';

	interface Props {
		open: boolean;
		onClose: () => void;
		onSave?: () => void;
	}

	let { open = false, onClose, onSave }: Props = $props();

	let providerId = $state<AIProviderId>('deepseek');
	let apiKey = $state('');
	let model = $state('');
	let error = $state('');

	const t = $derived(UI_TEXTS[$settings.locale].aiSettings);
	const currentProvider = $derived(getProvider(providerId));
	const modelOptions = $derived(currentProvider?.models ?? []);

	$effect(() => {
		if (open) {
			const s = aiSettings.get();
			providerId = s.provider;
			apiKey = s.apiKey;
			model = s.model ?? '';
			error = '';
		}
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		const key = apiKey.trim();
		if (!key) {
			error = get(settings).locale === 'zh' ? '请填写 API Key' : 'Please enter API Key';
			return;
		}
		aiSettings.setAll({
			provider: providerId,
			apiKey: key,
			model: model.trim() || undefined
		});
		onSave?.();
		onClose();
	}
</script>

<Modal
	{open}
	title={t.title}
	closeLabel={UI_TEXTS[$settings.locale].modal.close}
	{onClose}
>
	<form class="ai-settings-form" onsubmit={handleSubmit}>
		<p class="form-hint">{t.hint}</p>

		<div class="form-group">
			<label for="ai-provider">{t.provider}</label>
			<select id="ai-provider" bind:value={providerId} class="form-select">
				{#each AI_PROVIDERS as p}
					<option value={p.id}>{p.name}</option>
				{/each}
			</select>
		</div>

		<div class="form-group">
			<label for="ai-apikey">{t.apiKey}</label>
			<input
				id="ai-apikey"
				type="password"
				class="form-input"
				placeholder={t.apiKeyPlaceholder}
				bind:value={apiKey}
				autocomplete="off"
			/>
		</div>

		{#if modelOptions.length > 0}
			<div class="form-group">
				<label for="ai-model">{t.model} <span class="optional">({t.modelOptional})</span></label>
				<select id="ai-model" bind:value={model} class="form-select">
					<option value="">默认</option>
					{#each modelOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>
		{/if}

		{#if error}
			<p class="form-error" role="alert">{error}</p>
		{/if}

		<div class="form-actions">
			<button type="button" class="btn btn-secondary" onclick={onClose}>{t.cancel}</button>
			<button type="submit" class="btn btn-primary">{t.save}</button>
		</div>
	</form>
</Modal>

<style>
	.ai-settings-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.form-hint {
		font-size: 0.7rem;
		color: var(--text-muted);
		margin: 0 0 0.25rem 0;
		line-height: 1.4;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.form-group label {
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.form-group .optional {
		font-weight: 400;
		color: var(--text-muted);
	}

	.form-input,
	.form-select {
		padding: 0.4rem 0.5rem;
		font-size: 0.75rem;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: var(--surface);
		color: var(--text-primary);
	}

	.form-input::placeholder {
		color: var(--text-muted);
	}

	.form-select {
		cursor: pointer;
	}

	.form-error {
		font-size: 0.7rem;
		color: var(--danger);
		margin: 0;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.btn {
		padding: 0.4rem 0.75rem;
		font-size: 0.75rem;
		border-radius: 4px;
		cursor: pointer;
		border: 1px solid var(--border);
	}

	.btn-primary {
		background: var(--accent);
		color: white;
		border-color: var(--accent);
	}

	.btn-primary:hover {
		opacity: 0.9;
	}

	.btn-secondary {
		background: var(--surface);
		color: var(--text-secondary);
	}

	.btn-secondary:hover {
		background: var(--surface-hover);
		color: var(--text-primary);
	}
</style>
