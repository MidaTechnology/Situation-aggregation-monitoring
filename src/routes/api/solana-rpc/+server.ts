import { json } from '@sveltejs/kit';
import { execFile } from 'node:child_process';

const DEFAULT_SOLANA_RPC_URLS = ['https://api.mainnet-beta.solana.com'] as const;

function getSolanaRpcUrls(): string[] {
	const raw =
		process.env.SOLANA_RPC_URLS ||
		process.env.VITE_SOLANA_RPC_URLS ||
		process.env.SOLANA_RPC_URL ||
		process.env.VITE_SOLANA_RPC_URL ||
		'';
	if (!raw) return [...DEFAULT_SOLANA_RPC_URLS];
	return raw
		.split(',')
		.map((u) => u.trim())
		.filter(Boolean);
}

function postJson(urlStr: string, payload: unknown): Promise<{ status: number; text: string }> {
	return new Promise((resolve, reject) => {
		const marker = '__STATUS__:';
		const args = [
			'-s',
			'--max-time',
			'10',
			'--connect-timeout',
			'5',
			'-H',
			'Content-Type: application/json',
			'--data-raw',
			JSON.stringify(payload),
			'-w',
			`\n${marker}%{http_code}`,
			urlStr
		];
		execFile('curl', args, (err, stdout) => {
			if (err) return reject(err);
			const idx = stdout.lastIndexOf(`\n${marker}`);
			if (idx === -1) return resolve({ status: 0, text: stdout });
			const body = stdout.slice(0, idx);
			const statusStr = stdout.slice(idx + marker.length + 1).trim();
			const status = Number.parseInt(statusStr, 10) || 0;
			resolve({ status, text: body });
		});
	});
}

export async function POST({ request }) {
	try {
		let payload: unknown;
		try {
			payload = await request.json();
		} catch {
			return json({ error: 'Invalid JSON body' }, { status: 400 });
		}
		const urls = getSolanaRpcUrls();
		let lastError: { url: string; status?: number; body?: string } | null = null;
		for (const url of urls) {
			try {
				const { status, text } = await postJson(url, payload);
				if (status < 200 || status >= 300) {
					lastError = { url, status, body: text };
					continue;
				}
				// If RPC returns an error object, try next endpoint.
				try {
					const parsed = JSON.parse(text) as { error?: unknown };
					if (parsed?.error) {
						lastError = { url, status, body: text };
						continue;
					}
				} catch {
					// Non-JSON response; treat as failure and try next.
					lastError = { url, status, body: text };
					continue;
				}
				return new Response(text, {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			} catch (e) {
				const msg = e instanceof Error ? e.message : 'fetch failed';
				lastError = { url, status: 0, body: msg };
				continue;
			}
		}
		return json(
			{ error: 'All Solana RPC endpoints failed', lastError },
			{ status: 502 }
		);
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Request failed';
		return json({ error: msg }, { status: 500 });
	}
}
