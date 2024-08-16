export function sendBeacon(url: string) {
	return fetch(url, {
		mode: "no-cors",
	}).then(
		() => {},
		() => {},
	);
}
