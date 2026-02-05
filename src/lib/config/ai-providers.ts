/**
 * AI provider config for AI Insights summary (DeepSeek, OpenAI/ChatGPT, etc.)
 */

export type AIProviderId = 'deepseek' | 'openai';

export interface AIProviderConfig {
	id: AIProviderId;
	name: string;
	baseUrl: string;
	defaultModel: string;
	/** Optional model options for dropdown */
	models?: { value: string; label: string }[];
}

export const AI_PROVIDERS: AIProviderConfig[] = [
	{
		id: 'deepseek',
		name: 'DeepSeek',
		baseUrl: 'https://api.deepseek.com/v1',
		defaultModel: 'deepseek-chat',
		models: [
			{ value: 'deepseek-chat', label: 'deepseek-chat' },
			{ value: 'deepseek-reasoner', label: 'deepseek-reasoner' }
		]
	},
	{
		id: 'openai',
		name: 'ChatGPT (OpenAI)',
		baseUrl: 'https://api.openai.com/v1',
		defaultModel: 'gpt-4o-mini',
		models: [
			{ value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
			{ value: 'gpt-4o', label: 'gpt-4o' },
			{ value: 'gpt-4-turbo', label: 'gpt-4-turbo' }
		]
	}
];

export function getProvider(id: AIProviderId): AIProviderConfig | undefined {
	return AI_PROVIDERS.find((p) => p.id === id);
}
