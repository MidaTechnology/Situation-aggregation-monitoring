<script lang="ts">
	import Modal from './Modal.svelte';
	import { monitors, settings } from '$lib/stores';
	import { UI_TEXTS } from '$lib/config';
	import type { CustomMonitor } from '$lib/types';

	interface Props {
		open: boolean;
		onClose: () => void;
		onSave?: () => void;
		editMonitor?: CustomMonitor | null;
	}

	let { open = false, onClose, onSave, editMonitor = null }: Props = $props();

	let name = $state('');
	let keywords = $state('');
	let enabled = $state(true);
	let error = $state('');

	const t = $derived(UI_TEXTS[$settings.locale].monitorForm);

	// Reset form when modal opens
	$effect(() => {
		if (open) {
			if (editMonitor) {
				name = editMonitor.name;
				keywords = editMonitor.keywords.join(', ');
				enabled = editMonitor.enabled;
			} else {
				name = '';
				keywords = '';
				enabled = true;
			}
			error = '';
		}
	});

	function handleSubmit(e: Event) {
		e.preventDefault();

		const trimmedName = name.trim();
		const keywordList = keywords
			.split(',')
			.map((k) => k.trim().toLowerCase())
			.filter((k) => k.length > 0);

		if (!trimmedName) {
			error = t.nameRequired;
			return;
		}

		if (keywordList.length === 0) {
			error = t.keywordRequired;
			return;
		}

		if (editMonitor) {
			monitors.updateMonitor(editMonitor.id, {
				name: trimmedName,
				keywords: keywordList,
				enabled
			});
		} else {
			const result = monitors.addMonitor({
				name: trimmedName,
				keywords: keywordList,
				enabled
			});

			if (!result) {
				error = t.maxMonitors;
				return;
			}
		}

		onSave?.();
		onClose();
	}

	function handleDelete() {
		if (editMonitor) {
			monitors.deleteMonitor(editMonitor.id);
			onClose();
		}
	}
</script>

<Modal
	{open}
	title={editMonitor ? t.editMonitor : t.createMonitor}
	closeLabel={UI_TEXTS[$settings.locale].modal.close}
	{onClose}
>
	<form class="monitor-form" onsubmit={handleSubmit}>
		{#if error}
			<div class="form-error">{error}</div>
		{/if}

		<div class="form-group">
			<label for="monitor-name">{t.name}</label>
			<input
				id="monitor-name"
				type="text"
				bind:value={name}
				placeholder={t.placeholderName}
				maxlength="50"
			/>
		</div>

		<div class="form-group">
			<label for="monitor-keywords">{t.keywords}</label>
			<input
				id="monitor-keywords"
				type="text"
				bind:value={keywords}
				placeholder={t.placeholderKeywords}
			/>
			<p class="form-hint">{t.formHint}</p>
		</div>

		<div class="form-group">
			<label class="checkbox-label">
				<input type="checkbox" bind:checked={enabled} />
				<span>{t.enabled}</span>
			</label>
		</div>

		<div class="form-actions">
			{#if editMonitor}
				<button type="button" class="delete-btn" onclick={handleDelete}>{t.delete}</button>
			{/if}
			<button type="button" class="cancel-btn" onclick={onClose}>{t.cancel}</button>
			<button type="submit" class="submit-btn">
				{editMonitor ? t.saveChanges : t.create}
			</button>
		</div>
	</form>
</Modal>

<style>
	.monitor-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-error {
		background: rgba(255, 68, 68, 0.1);
		border: 1px solid rgba(255, 68, 68, 0.3);
		border-radius: 4px;
		padding: 0.5rem;
		color: var(--danger);
		font-size: 0.7rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.form-group label {
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.form-group input[type='text'] {
		padding: 0.5rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-primary);
		font-size: 0.75rem;
	}

	.form-group input[type='text']:focus {
		outline: none;
		border-color: var(--accent);
	}

	.form-hint {
		font-size: 0.6rem;
		color: var(--text-muted);
		margin: 0;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.7rem;
		color: var(--text-primary);
	}

	.checkbox-label input {
		accent-color: var(--accent);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.cancel-btn,
	.submit-btn,
	.delete-btn {
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.cancel-btn {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text-secondary);
	}

	.cancel-btn:hover {
		background: var(--border);
		color: var(--text-primary);
	}

	.submit-btn {
		background: var(--accent);
		border: 1px solid var(--accent);
		color: white;
	}

	.submit-btn:hover {
		filter: brightness(1.1);
	}

	.delete-btn {
		background: transparent;
		border: 1px solid rgba(255, 68, 68, 0.3);
		color: var(--danger);
		margin-right: auto;
	}

	.delete-btn:hover {
		background: rgba(255, 68, 68, 0.1);
	}
</style>
