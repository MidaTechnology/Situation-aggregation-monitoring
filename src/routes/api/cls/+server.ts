import type { RequestHandler } from '@sveltejs/kit';

interface ClsItem {
	id: string;
	title: string;
	summary: string;
	time: string;
	link?: string;
}

// Very lightweight HTML→text scraper for https://www.cls.cn/telegraph
// 1) 粗略把 HTML 转成纯文本（加入换行）
// 2) 再基于时间 + 【标题】 的模式做分块
function htmlToText(raw: string): string {
	// 去掉 script / style 内容
	let s = raw.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
	// 换行型标签统一替换为换行
	s = s
		.replace(/<(br|BR)\s*\/?>/g, '\n')
		.replace(/<\/(p|P|li|LI|div|DIV|section|SECTION|article|ARTICLE)>/g, '\n');
	// 其他标签直接去掉
	s = s.replace(/<[^>]+>/g, '');
	// 统一行结尾
	s = s.replace(/\r\n/g, '\n');
	return s;
}

function parseClsTelegraph(raw: string): ClsItem[] {
	const items: ClsItem[] = [];

	const text = htmlToText(raw);

	// Split into logical blocks starting with a time like "14:40:49" or "14:40"
	const blockRegex = /(^|\n)(\d{2}:\d{2}(?::\d{2})?)([\s\S]*?)(?=\n\d{2}:\d{2}|\n加载更多|$)/g;

	let match: RegExpExecArray | null;
	while ((match = blockRegex.exec(text)) !== null) {
		const time = match[2].trim();
		const blockBody = match[3].trim();

		// Title is usually in brackets: 【...】
		const titleMatch = blockBody.match(/【([^】]+)】/);
		const title = titleMatch ? titleMatch[1].trim() : '';

		// Summary: first non-empty line after the title
		let summary = '';
		if (titleMatch) {
			const afterTitle = blockBody.slice(titleMatch.index! + titleMatch[0].length).trim();
			const lines = afterTitle.split('\n').map((l) => l.trim()).filter(Boolean);
			if (lines.length > 0) {
				summary = lines[0];
			}
		} else {
			// Fallback: use first line as summary
			const lines = blockBody.split('\n').map((l) => l.trim()).filter(Boolean);
			if (lines.length > 0) {
				summary = lines[0];
			}
		}

		// Try to find detail link like https://www.cls.cn/detail/2277602
		const linkMatch = blockBody.match(/https?:\/\/www\.cls\.cn\/detail\/\d+/);
		const link = linkMatch ? linkMatch[0] : undefined;

		if (!title && !summary) continue;

		const id = `cls-${time.replace(/:/g, '')}-${items.length}`;
		items.push({ id, title: title || summary, summary, time, link });
	}

	return items;
}

export const GET: RequestHandler = async () => {
	try {
		const res = await fetch('https://www.cls.cn/telegraph', {
			headers: {
				// Pretend to be a normal browser
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
			}
		});

		if (!res.ok) {
			return new Response(
				JSON.stringify({ items: [], error: `HTTP ${res.status}: ${res.statusText}` }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json; charset=utf-8' }
				}
			);
		}

		const html = await res.text();
		const items = parseClsTelegraph(html).slice(0, 80); // cap to 80 latest items

		return new Response(JSON.stringify({ items }), {
			status: 200,
			headers: { 'Content-Type': 'application/json; charset=utf-8' }
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return new Response(JSON.stringify({ items: [], error: message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json; charset=utf-8' }
		});
	}
};

