import { bapi } from "../_shared/env";

let proxyInfo: any = null;

// @ts-ignore - this is a MV2 api
bapi.proxy.onRequest.addListener(
	(requestInfo) => {
		if (proxyInfo) return proxyInfo;

		return { type: "direct" };
	},
	{
		urls: [
			"*://steamcommunity.com/*",
			"*://store.steampowered.com/*",
			"*://login.steampowered.com/*",
			"*://google.com/recaptcha/enterprise/*",
			"*://recaptcha.net/recaptcha/enterprise/*",
		],
	},
);

export function setProxy(proxy: any) {
	proxyInfo = proxy;
}
