import { removeCSP } from "./csp";

export async function storeScript(script: string, cleanup: string) {
	const tab = await new Promise<chrome.tabs.Tab>((resolve) => {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			resolve(tabs[0]);
		});
	});
	await chrome.storage.local.set({ script, cleanup, tabId: tab.id });
	if (tab) await removeCSP(tab.id);
}
