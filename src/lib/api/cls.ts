export interface ClsTelegraphItem {
	id: string;
	title: string;
	summary: string;
	time: string;
	link?: string;
}

interface ClsResponse {
	items: ClsTelegraphItem[];
	error?: string;
}

export async function fetchClsTelegraph(): Promise<ClsTelegraphItem[]> {
	try {
		const res = await fetch('/api/cls');
		if (!res.ok) {
			console.warn('CLS telegraph fetch failed with status', res.status, res.statusText);
			return [];
		}
		const data = (await res.json()) as ClsResponse;
		if (data.error) {
			console.warn('CLS telegraph API error:', data.error);
		}
		return Array.isArray(data.items) ? data.items : [];
	} catch (e) {
		console.warn('CLS telegraph fetch failed:', e);
		return [];
	}
}

