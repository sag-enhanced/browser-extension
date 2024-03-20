export function setProxy(proxy: string) {
	const parsed = new URL(proxy);
	const pacScript = FindProxyForURL.toString().replace("%s", parsed.host);

	console.log("[sage/proxy] setting proxy", pacScript);

	return new Promise((resolve) => {
		chrome.proxy.settings.set(
			{
				value: {
					mode: "pac_script",
					pacScript: {
						data: pacScript,
					},
				},
				scope: "regular",
			},
			resolve,
		);
	});
}

function FindProxyForURL(url: string, host: string): string {
	// the URL is stripped, so we can only check for google.com
	if (host === "store.steampowered.com" || host === "google.com") {
		return "PROXY %s";
	}
	return "DIRECT";
}

export function removeProxy() {
	console.log("[sage/proxy] removing proxy");

	return new Promise((resolve) => {
		chrome.proxy.settings.clear(
			{
				scope: "regular",
			},
			resolve,
		);
	});
}
