/**
 * Cryptocurrency Alerting API - Wallet Watch alerts
 * https://cryptocurrencyalerting.com/rest-api.html
 * Auth: HTTP Basic with API token as username, password blank.
 */

const BASE_URL = 'https://api.cryptocurrencyalerting.com/v1';

type Blockchain = 'AVAX' | 'BSC' | 'BTC' | 'ETH' | 'MATIC' | 'OP' | 'TRX';

function inferBlockchain(address: string): Blockchain {
	const trimmed = address.trim();
	if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return 'ETH';
	if (
		/^bc1[a-zA-HJ-NP-Z0-9]{25,}$/.test(trimmed) ||
		/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmed)
	)
		return 'BTC';
	if (/^T[a-zA-HJ-NP-Z0-9]{33}$/.test(trimmed)) return 'TRX';
	if (trimmed.startsWith('0x')) return 'ETH';
	return 'ETH';
}

export interface CreateWalletAlertResult {
	ok: true;
	id: number;
}

export interface CreateWalletAlertError {
	ok: false;
	error: string;
}

export type CreateWalletAlertResponse = CreateWalletAlertResult | CreateWalletAlertError;

/**
 * Create a Wallet Watch alert for the given address.
 * Notifications go to the user's configured channel (email, webhook, etc.) on Cryptocurrency Alerting.
 */
export async function createWalletWatchAlert(
	apiKey: string,
	address: string
): Promise<CreateWalletAlertResponse> {
	const blockchain = inferBlockchain(address);
	const body = {
		type: 'wallet',
		blockchain,
		address: address.trim(),
		direction: 'changes' as const,
		channel: { name: 'email' as const }
	};
	const auth = btoa(`${apiKey}:`);
	try {
		const res = await fetch(`${BASE_URL}/alert-conditions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${auth}`
			},
			body: JSON.stringify(body)
		});
		const data = (await res.json()) as { id?: number; message?: string; status?: string };
		if (res.ok && typeof data.id === 'number') {
			return { ok: true, id: data.id };
		}
		const msg =
			typeof data.message === 'string' ? data.message : res.statusText || 'Request failed';
		return { ok: false, error: msg };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return { ok: false, error: msg };
	}
}

/**
 * Delete an alert condition by ID.
 */
export async function deleteWalletAlert(
	apiKey: string,
	alertId: number
): Promise<{ ok: boolean; error?: string }> {
	const auth = btoa(`${apiKey}:`);
	try {
		const res = await fetch(`${BASE_URL}/alert-conditions/${alertId}`, {
			method: 'DELETE',
			headers: { Authorization: `Basic ${auth}` }
		});
		if (res.ok) return { ok: true };
		const data = (await res.json()) as { message?: string };
		return { ok: false, error: (data.message as string) || res.statusText };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return { ok: false, error: msg };
	}
}
