<script lang="ts">
	import { Panel } from '$lib/components/common';
	import Modal from '$lib/components/modals/Modal.svelte';
	import { settings, whaleAddresses } from '$lib/stores';
import { getPanelName, UI_TEXTS } from '$lib/config';
import { ETHERSCAN_API_KEY } from '$lib/config/api';
	import type { WhaleTransaction, WhaleBalance } from '$lib/api';

	interface Props {
		whales?: WhaleTransaction[];
		balances?: WhaleBalance[];
		loading?: boolean;
		error?: string | null;
		onWhaleListChange?: () => void;
	}

	let {
		whales = [],
		balances = [],
		loading = false,
		error = null,
		onWhaleListChange
	}: Props = $props();

	let addModalOpen = $state(false);
	let addressInput = $state('');
	let addressError = $state('');

	const count = $derived(whales.length);
	const title = $derived(getPanelName('whales', $settings.locale));
	const addresses = $derived($whaleAddresses);
	const t = $derived(UI_TEXTS[$settings.locale].whale);
	const modalCloseLabel = $derived(UI_TEXTS[$settings.locale].modal.close);

	const canAddMore = $derived(addresses.length < 30);

	function truncateAddr(addr: string, head = 6, tail = 4): string {
		if (addr.length <= head + tail) return addr;
		return addr.slice(0, head) + '…' + addr.slice(-tail);
	}

	function handleAddAddress() {
		addressError = '';
		const result = whaleAddresses.addAddress(addressInput);
		if (result.ok) {
			addressInput = '';
			addModalOpen = false;
			onWhaleListChange?.();
		} else {
			addressError = result.error ?? t.invalidAddress;
		}
	}

	async function handleRemoveAddress(addr: string) {
		await whaleAddresses.removeAddress(addr);
		onWhaleListChange?.();
	}

	function formatAmount(amt: number): string {
		return amt >= 1000 ? (amt / 1000).toFixed(1) + 'K' : amt.toFixed(2);
	}

	function formatUSD(usd: number): string {
		if (usd >= 1e9) return '$' + (usd / 1e9).toFixed(1) + 'B';
		if (usd >= 1e6) return '$' + (usd / 1e6).toFixed(1) + 'M';
		return '$' + (usd / 1e3).toFixed(0) + 'K';
	}

	function isEthAddress(addr: string): boolean {
		return /^0x[a-fA-F0-9]{40}$/.test((addr || '').trim());
	}

	function isBtcAddress(addr: string): boolean {
		return (
			/^[13bc][a-km-zA-HJ-NP-Z1-9]{25,}$/.test((addr || '').trim()) ||
			/^bc1[a-zA-HJ-NP-Z0-9]{25,}$/.test((addr || '').trim())
		);
	}

	function isSolAddress(addr: string): boolean {
		const a = (addr || '').trim();
		return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a) && !isEthAddress(a) && !isBtcAddress(a);
	}

	function isEthTxHash(hash: string): boolean {
		return /^0x[a-fA-F0-9]{64}$/.test((hash || '').trim());
	}

	function isSolTxHash(hash: string): boolean {
		return /^[1-9A-HJ-NP-Za-km-z]{32,88}$/.test((hash || '').trim());
	}

	function addressExplorerUrl(addr: string): string | null {
		const a = (addr || '').trim();
		if (isEthAddress(a)) return `https://etherscan.io/address/${a}`;
		if (isSolAddress(a)) return `https://solscan.io/account/${a}`;
		if (/^[13bc][a-km-zA-HJ-NP-Z1-9]{25,}$/.test(a) || /^bc1[a-zA-HJ-NP-Z0-9]{25,}$/.test(a))
			return `https://blockstream.info/address/${a}`;
		return null;
	}

	function txExplorerUrl(hash: string): string | null {
		const h = (hash || '').trim();
		if (isEthTxHash(h)) return `https://etherscan.io/tx/${h}`;
		if (isSolTxHash(h)) return `https://solscan.io/tx/${h}`;
		if (/^[a-f0-9]{64}$/i.test(h)) return `https://blockstream.info/tx/${h}`;
		return null;
	}
</script>

<Panel id="whales" {title} {count} {loading} {error}>
	<!-- Watched addresses -->
	<div class="whale-addresses-section">
		<div class="section-label">{t.watchedAddresses}</div>
		{#if addresses.length === 0}
			<p class="no-addresses-hint">{t.emptyHint}</p>
		{:else}
			<div class="address-chips">
				{#each addresses as addr (addr)}
					<span class="address-chip">
						{#if addressExplorerUrl(addr)}
							<a
								href={addressExplorerUrl(addr)!}
								target="_blank"
								rel="noopener noreferrer"
								class="addr-link addr-text"
								title={addr}>{truncateAddr(addr, 8, 6)}</a
							>
						{:else}
							<code class="addr-text" title={addr}>{truncateAddr(addr, 8, 6)}</code>
						{/if}
						<button
							type="button"
							class="chip-remove"
							title={t.remove}
							aria-label={t.remove}
							onclick={() => handleRemoveAddress(addr)}
						>
							×
						</button>
					</span>
				{/each}
			</div>
		{/if}
		{#if canAddMore}
			<button
				type="button"
				class="add-addr-btn"
				title={t.addAddress}
				onclick={() => (addModalOpen = true)}
			>
				+ {t.addAddress}
			</button>
		{:else}
			<span class="max-hint">{t.maxReached}</span>
		{/if}
	</div>

	<!-- Balance section -->
	{#if balances.length > 0}
		<div class="whale-section">
			<div class="section-label">{t.balanceSection}</div>
			<div class="whale-list">
				{#each balances as bal (bal.address)}
					<div class="whale-item">
						<div class="whale-main">
							<div class="whale-header">
								{#if addressExplorerUrl(bal.address)}
									<a
										href={addressExplorerUrl(bal.address)!}
										target="_blank"
										rel="noopener noreferrer"
										class="addr-from addr-link"
										title={bal.address}>{truncateAddr(bal.address, 8, 6)}</a
									>
								{:else}
									<span class="addr-from" title={bal.address}
										>{truncateAddr(bal.address, 8, 6)}</span
									>
								{/if}
								<span class="whale-usd">{formatUSD(bal.totalUsd)}</span>
							</div>
							<div class="balance-coins">
								{#each bal.coins as c (c.coin + bal.address)}
									<span class="balance-coin-tag"
										><span class="whale-coin">{c.coin}</span>
										{formatAmount(c.amount)}
										<span class="whale-usd-sub">{formatUSD(c.usd)}</span></span
									>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else if addresses.length > 0}
		<div class="whale-section">
			<div class="section-label">{t.balanceSection}</div>
			<p class="no-addresses-hint">{t.emptyBalance}</p>
		</div>
	{/if}

	<!-- Transactions section -->
	<div class="whale-section">
		<div class="section-label">{t.transactionsSection}</div>
		{#if whales.length === 0 && !loading && !error}
			<div class="empty-state">{t.emptyTx}</div>
		{:else if whales.length > 0}
			<div class="whale-list">
				{#each whales as whale, i (whale.hash + i)}
					<div class="whale-item">
						<div class="whale-main">
							<div class="whale-header">
								<span class="whale-coin">{whale.coin}</span>
								<span class="whale-amount">{formatAmount(whale.amount)} {whale.coin}</span>
							</div>
							<div class="whale-flow">
								{#if whale.fromAddress}
									{#if addressExplorerUrl(whale.fromAddress)}
										<a
											href={addressExplorerUrl(whale.fromAddress)!}
											target="_blank"
											rel="noopener noreferrer"
											class="addr-from addr-link"
											title={whale.fromAddress}>{truncateAddr(whale.fromAddress)}</a
										>
									{:else}
										<span class="addr-from" title={whale.fromAddress}
											>{truncateAddr(whale.fromAddress)}</span
										>
									{/if}
									<span class="arrow">→</span>
									{#if whale.toAddress && addressExplorerUrl(whale.toAddress)}
										<a
											href={addressExplorerUrl(whale.toAddress)!}
											target="_blank"
											rel="noopener noreferrer"
											class="addr-to addr-link"
											title={whale.toAddress}>{truncateAddr(whale.toAddress)}</a
										>
									{:else}
										<span class="addr-to" title={whale.toAddress ?? ''}
											>{whale.toAddress ? truncateAddr(whale.toAddress) : '—'}</span
										>
									{/if}
								{/if}
								<span class="whale-usd">{formatUSD(whale.usd)}</span>
							</div>
							<div class="whale-hash-row">
								{#if txExplorerUrl(whale.hash)}
									<a
										href={txExplorerUrl(whale.hash)!}
										target="_blank"
										rel="noopener noreferrer"
										class="whale-hash addr-link"
										title={whale.hash}>{truncateAddr(whale.hash, 10, 8)}</a
									>
								{:else}
									<span class="whale-hash" title={whale.hash}
										>{truncateAddr(whale.hash, 10, 8)}</span
									>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
	{#if t.productionHint && !ETHERSCAN_API_KEY.trim()}
		<p class="production-hint" title="VITE_ETHERSCAN_API_KEY">{t.productionHint}</p>
	{/if}
</Panel>

<Modal
	open={addModalOpen}
	title={t.addAddressModalTitle}
	closeLabel={modalCloseLabel}
	onClose={() => {
		addModalOpen = false;
		addressInput = '';
		addressError = '';
	}}
>
	<div class="add-address-content">
		<label for="whale-addr-input" class="sr-only">{t.addressPlaceholder}</label>
		<input
			id="whale-addr-input"
			type="text"
			class="address-input"
			placeholder={t.addressPlaceholder}
			bind:value={addressInput}
			onkeydown={(e) => e.key === 'Enter' && handleAddAddress()}
		/>
		{#if addressError}
			<p class="input-error">{addressError}</p>
		{/if}
		<button type="button" class="submit-addr-btn" onclick={handleAddAddress}>{t.confirmAdd}</button>
	</div>
</Modal>

<style>
	.whale-addresses-section {
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border);
		margin-bottom: 0.5rem;
	}

	.section-label {
		font-size: 0.6rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.35rem;
	}

	.no-addresses-hint {
		font-size: 0.65rem;
		color: var(--text-muted);
		margin: 0 0 0.5rem;
	}

	.address-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-bottom: 0.5rem;
	}

	.address-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.2rem 0.4rem;
		background: rgba(var(--accent-rgb), 0.08);
		border: 1px solid var(--border);
		border-radius: 4px;
		font-size: 0.6rem;
	}

	.addr-text {
		font-family: ui-monospace, monospace;
		color: var(--text-secondary);
	}

	.chip-remove {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 0;
		line-height: 1;
		font-size: 1rem;
	}

	.chip-remove:hover {
		color: var(--danger);
	}

	.add-addr-btn {
		padding: 0.35rem 0.6rem;
		background: rgba(var(--accent-rgb), 0.1);
		border: 1px solid var(--accent);
		border-radius: 4px;
		color: var(--accent);
		font-size: 0.65rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.add-addr-btn:hover {
		background: rgba(var(--accent-rgb), 0.2);
	}

	.max-hint {
		font-size: 0.6rem;
		color: var(--text-muted);
	}

	.whale-list {
		display: flex;
		flex-direction: column;
	}

	.whale-item {
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
	}

	.whale-item:last-child {
		border-bottom: none;
	}

	.whale-main {
		min-width: 0;
	}

	.whale-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
	}

	.whale-coin {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--accent);
	}

	.whale-amount {
		font-size: 0.65rem;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.whale-flow {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.6rem;
		flex-wrap: wrap;
	}

	.addr-from,
	.addr-to {
		font-family: ui-monospace, monospace;
		color: var(--text-secondary);
	}

	.addr-link {
		color: var(--accent);
		text-decoration: none;
	}

	.addr-link:hover {
		text-decoration: underline;
	}

	.arrow {
		color: var(--text-muted);
	}

	.whale-usd {
		color: var(--success);
		font-weight: 500;
		margin-left: auto;
	}

	.whale-usd-sub {
		font-size: 0.6rem;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.balance-coins {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 0.75rem;
		margin-top: 0.25rem;
		font-size: 0.65rem;
	}

	.balance-coin-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
	}

	.whale-section {
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border);
		margin-bottom: 0.5rem;
	}

	.whale-section:last-of-type {
		border-bottom: none;
		padding-bottom: 0;
		margin-bottom: 0;
	}

	.whale-hash-row {
		margin-top: 0.2rem;
	}

	.whale-hash {
		font-size: 0.55rem;
		font-family: ui-monospace, monospace;
		color: var(--text-muted);
	}

	.whale-hash.addr-link {
		color: var(--accent);
		cursor: pointer;
	}

	.add-address-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.address-input {
		padding: 0.5rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-primary);
		font-size: 0.75rem;
		font-family: ui-monospace, monospace;
	}

	.address-input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.input-error {
		font-size: 0.7rem;
		color: var(--danger);
		margin: 0;
	}

	.submit-addr-btn {
		padding: 0.5rem 1rem;
		background: var(--accent);
		border: 1px solid var(--accent);
		border-radius: 4px;
		color: var(--bg);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		align-self: flex-start;
	}

	.submit-addr-btn:hover {
		filter: brightness(1.1);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}

	.production-hint {
		margin: 0.5rem 0 0;
		padding-top: 0.5rem;
		border-top: 1px solid var(--border);
		font-size: 0.55rem;
		color: var(--text-muted);
		line-height: 1.3;
	}
</style>
