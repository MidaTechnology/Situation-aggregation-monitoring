/**
 * Server-side proxy for DeepSeek chat completions (avoids CORS in dev).
 * POST body: { prompt: string }
 * Returns: { content: string }
 * Only available when running with SvelteKit server (e.g. npm run dev).
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const DEEPSEEK_API_BASE = 'https://api.deepseek.com/v1';
const MODEL = 'deepseek-chat';
const MAX_TOKENS = 1024;

export const POST: RequestHandler = async ({ request }) => {
	const apiKey = process.env.VITE_AI_API_KEY?.trim();
	if (!apiKey) {
		return json({ error: '未配置 VITE_AI_API_KEY' }, { status: 500 });
	}

	let prompt: string;
	try {
		const body = await request.json();
		if (typeof body?.prompt !== 'string') {
			return json({ error: '缺少 prompt' }, { status: 400 });
		}
		prompt = body.prompt;
	} catch {
		return json({ error: '无效的请求体' }, { status: 400 });
	}

	const res = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: MODEL,
			messages: [{ role: 'user', content: prompt }],
			max_tokens: MAX_TOKENS,
			temperature: 0.5
		})
	});

	if (!res.ok) {
		const errText = await res.text();
		return json(
			{ error: `DeepSeek API ${res.status}: ${errText || res.statusText}` },
			{ status: 502 }
		);
	}

	const data = (await res.json()) as {
		choices?: Array<{ message?: { content?: string }; text?: string }>;
		error?: { message?: string };
	};

	if (data.error?.message) {
		return json({ error: data.error.message }, { status: 502 });
	}

	const first = data.choices?.[0];
	const content = (first?.message?.content ?? first?.text ?? '').trim();
	if (!content) {
		return json({ error: 'DeepSeek 返回内容为空' }, { status: 502 });
	}

	return json({ content });
};
