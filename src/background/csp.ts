// Remove CSP header from steam page

import { register } from "./rpc";

export async function removeCSP(tabId: number) {
	if (__targetMV === 2) {
		chrome.webRequest.onHeadersReceived.addListener(
			(details) => {
				for (let i = 0; i < details.responseHeaders.length; i++) {
					if (
						details.responseHeaders[i].name.toLowerCase() ===
						"content-security-policy"
					) {
						details.responseHeaders[i].value = "";
					}
				}
				return { responseHeaders: details.responseHeaders };
			},
			{
				urls: ["https://store.steampowered.com/join/#sage"],
				types: ["main_frame"],
				tabId,
			},
			["blocking", "responseHeaders"],
		);
	} else {
		await chrome.declarativeNetRequest.updateSessionRules({
			addRules: [
				{
					id: 1,
					priority: 1,
					action: {
						type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
						responseHeaders: [
							{
								header: "content-security-policy",
								operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
							},
						],
					},
					condition: {
						urlFilter: "https://store.steampowered.com/join/",
						resourceTypes: [
							chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
						],
						tabIds: [tabId],
					},
				},
			],
			removeRuleIds: [1],
		});
	}
}
