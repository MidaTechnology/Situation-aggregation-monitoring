/**
 * BlockBeats RESTful API - crypto news flash & articles
 * https://github.com/BlockBeatsOfficial/RESTful-API
 * Base: https://api.theblockbeats.news/v1/
 */

const BASE_URL = 'https://api.theblockbeats.news/v1';

export type BlockBeatsLang = 'cn' | 'en' | 'cht';

export interface BlockBeatsFlashItem {
	id: number;
	title: string;
	content: string;
	pic: string;
	link: string;
	url: string;
	create_time: string;
}

export interface BlockBeatsFlashResponse {
	status: number;
	message: string;
	data?: {
		page: number;
		data: BlockBeatsFlashItem[];
	};
}

export interface BlockBeatsArticleItem {
	title: string;
	description?: string;
	content?: string;
	link: string;
	url?: string;
	pic?: string;
	column?: string;
	create_time: string;
	is_original?: boolean;
}

export interface BlockBeatsArticleResponse {
	status: number;
	message: string;
	data?: {
		page: string | number;
		data: BlockBeatsArticleItem[];
	};
}

/** Map app locale to BlockBeats lang param */
export function toBlockBeatsLang(locale: 'zh' | 'en'): BlockBeatsLang {
	return locale === 'zh' ? 'cn' : 'en';
}

/**
 * Fetch flash (快讯) list from BlockBeats
 * @param lang - cn | en | cht
 * @param size - page size
 * @param page - page number
 * @param type - e.g. push (important)
 */
export async function fetchBlockBeatsFlash(
	lang: BlockBeatsLang = 'cn',
	size = 20,
	page = 1,
	type = 'push'
): Promise<BlockBeatsFlashItem[]> {
	const params = new URLSearchParams({ size: String(size), page: String(page), type, lang });
	const url = `${BASE_URL}/open-api/open-flash?${params}`;
	try {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const json: BlockBeatsFlashResponse = await res.json();
		if (json.status !== 0 || !json.data?.data) return [];
		return json.data.data;
	} catch (e) {
		console.warn('BlockBeats flash fetch failed:', e);
		return [];
	}
}

/**
 * Fetch article/information (资讯) list from BlockBeats
 */
export async function fetchBlockBeatsInformation(
	lang: BlockBeatsLang = 'cn',
	size = 15,
	page = 1,
	type = 'push'
): Promise<BlockBeatsArticleItem[]> {
	const params = new URLSearchParams({ size: String(size), page: String(page), type, lang });
	const url = `${BASE_URL}/open-api/open-information?${params}`;
	try {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const json: BlockBeatsArticleResponse = await res.json();
		if (json.status !== 0 || !json.data?.data) return [];
		return json.data.data;
	} catch (e) {
		console.warn('BlockBeats information fetch failed:', e);
		return [];
	}
}
