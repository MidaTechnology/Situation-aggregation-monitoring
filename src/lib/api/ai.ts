/**
 * AI API - Chat completions for AI Insights summary
 * Supports DeepSeek, OpenAI (ChatGPT), etc. via user-configured API key or VITE_AI_API_KEY (DeepSeek).
 */

import { get } from 'svelte/store';
import { aiSettings } from '$lib/stores/aiSettings';
import { getProvider } from '$lib/config/ai-providers';
import { AI_API_KEY, DEEPSEEK_API_BASE } from '$lib/config/api';
import { getStructuredSummary } from '$lib/analysis/ai-context';
import type { Locale } from '$lib/config';
import type { AIModuleContext } from '$lib/analysis/ai-context';

const MAX_TOKENS = 1024;
const MAX_HEADLINES = 40;

export interface EffectiveAIConfig {
	apiKey: string;
	baseUrl: string;
	model: string;
	/** true if from user settings (localStorage), false if from env */
	fromUser: boolean;
}

/** Get effective API config: user settings first, then env (DeepSeek). */
export function getEffectiveAIConfig(): EffectiveAIConfig | null {
	const user = get(aiSettings);
	if (user.apiKey?.trim()) {
		const provider = getProvider(user.provider);
		if (provider) {
			return {
				apiKey: user.apiKey.trim(),
				baseUrl: provider.baseUrl,
				model: user.model?.trim() || provider.defaultModel,
				fromUser: true
			};
		}
	}
	if (AI_API_KEY?.trim()) {
		return {
			apiKey: AI_API_KEY.trim(),
			baseUrl: DEEPSEEK_API_BASE,
			model: 'deepseek-chat',
			fromUser: false
		};
	}
	return null;
}

function buildPrompt(context: AIModuleContext, locale: Locale): string {
	const bullets = getStructuredSummary(context, locale);
	const headlineLines = context.messages
		.slice(0, MAX_HEADLINES)
		.map((m) => `- [${m.source}] ${m.title}`)
		.join('\n');

	if (locale === 'zh') {
		return `你是一个情报与市场简报助手。根据以下聚合情报与近期标题，用 2–3 段话写一份简洁的「态势总结」：突出主要主题、风险/机会、市场与地缘要点。请使用中文输出。

【综合摘要】
${bullets.join('\n')}

【近期标题（样本）】
${headlineLines || '（无）'}

请直接输出总结正文，不要加「总结：」等前缀。最后追加 2–3 条可操作建议（条目列表）。`;
	}

	return `You are an intelligence and market briefing assistant. Based on the aggregated signals and recent headlines below, write a concise 2–3 paragraph situation summary highlighting key themes, risks/opportunities, market moves, and geopolitics. Respond in English.

Summary bullets:
${bullets.join('\n')}

Recent headlines (sample):
${headlineLines || '(none)'}

Output the summary only (no “Summary:” prefix). Finish with 2–3 actionable recommendations in a bullet list.`;
}

export interface GenerateSummaryResult {
	content: string;
}

async function callChatApi(
	baseUrl: string,
	apiKey: string,
	model: string,
	prompt: string
): Promise<GenerateSummaryResult> {
	const res = await fetch(`${baseUrl}/chat/completions`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model,
			messages: [{ role: 'user', content: prompt }],
			max_tokens: MAX_TOKENS,
			temperature: 0.5
		})
	});

	if (!res.ok) {
		const errText = await res.text();
		throw new Error(`API ${res.status}: ${errText || res.statusText}`);
	}

	const data = (await res.json()) as {
		choices?: Array<{ message?: { content?: string }; text?: string }>;
		error?: { message?: string };
	};

	if (data.error?.message) {
		throw new Error(data.error.message);
	}

	const first = data.choices?.[0];
	const content = (first?.message?.content ?? first?.text ?? '').trim();
	if (!content) {
		throw new Error('API 返回内容为空');
	}

	return { content };
}

/**
 * Generate AI summary from AI module context.
 * Uses user-configured provider/key when set; otherwise env VITE_AI_API_KEY (DeepSeek).
 * For env key only: tries server proxy /api/ai-summary first to avoid CORS in dev.
 */
export async function generateAISummary(
	context: AIModuleContext,
	locale: Locale
): Promise<GenerateSummaryResult> {
	const config = getEffectiveAIConfig();
	if (!config) {
		throw new Error(
			locale === 'zh'
				? '未配置 API Key。请在 AI 分析面板点击设置填入，或在 .env 中设置 VITE_AI_API_KEY。'
				: 'API key not configured. Add it in AI settings or set VITE_AI_API_KEY in .env.'
		);
	}

	const prompt = buildPrompt(context, locale);

	// User-configured key: always direct (no server proxy)
	if (config.fromUser) {
		return callChatApi(config.baseUrl, config.apiKey, config.model, prompt);
	}

	// Env key: try server proxy first (avoids CORS in dev)
	const tryProxy = async (): Promise<GenerateSummaryResult | null> => {
		try {
			const res = await fetch('/api/ai-summary', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt })
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error((data as { error?: string }).error || res.statusText);
			}
			const data = (await res.json()) as { content?: string };
			const content = data.content?.trim();
			if (!content) throw new Error('API 返回内容为空');
			return { content };
		} catch {
			return null;
		}
	};

	const proxyResult = await tryProxy();
	if (proxyResult) return proxyResult;

	return callChatApi(config.baseUrl, config.apiKey, config.model, prompt);
}

export function isAIConfigured(): boolean {
	return Boolean(getEffectiveAIConfig()?.apiKey);
}
