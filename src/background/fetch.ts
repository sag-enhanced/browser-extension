export async function backgroundFetch(url: string, init: RequestInit) {
	const response = await fetch(url, init);
	const headers = Object.fromEntries(response.headers.entries());
	return {
		data: headers["content-type"].startsWith("application/json")
			? await response.json()
			: await response.text(),
		headers,
		ok: response.ok,
		redirected: response.redirected,
		status: response.status,
		url: response.url,
	};
}
