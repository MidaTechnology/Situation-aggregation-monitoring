import { json } from '@sveltejs/kit';
import { execFile } from 'node:child_process';

const ETHERSCAN_API_BASE = 'https://api.etherscan.io/v2/api';

export async function GET({ url }) {
	try {
		const query = url.searchParams.toString();
		const target = query ? `${ETHERSCAN_API_BASE}?${query}` : ETHERSCAN_API_BASE;
		const marker = '__STATUS__:';
		const args = [
			'-s',
			'--max-time',
			'10',
			'--connect-timeout',
			'5',
			'-w',
			`\n${marker}%{http_code}`,
			target
		];
		const { status, text } = await new Promise<{ status: number; text: string }>((resolve, reject) => {
			execFile('curl', args, (err, stdout) => {
				if (err) return reject(err);
				const idx = stdout.lastIndexOf(`\n${marker}`);
				if (idx === -1) return resolve({ status: 0, text: stdout });
				const body = stdout.slice(0, idx);
				const statusStr = stdout.slice(idx + marker.length + 1).trim();
				const code = Number.parseInt(statusStr, 10) || 0;
				resolve({ status: code, text: body });
			});
		});
		if (status < 200 || status >= 300) {
			return json({ error: text || 'Request failed', status }, { status: 502 });
		}
		return new Response(text, {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Request failed';
		return json({ error: msg }, { status: 500 });
	}
}
