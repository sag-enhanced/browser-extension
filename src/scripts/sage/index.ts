import ready from "../../lib/dom";
import { register } from "./rpc";
import { getCookieJar, setCookieJar } from "./cookies";

ready(() => {
	const build = +chrome.runtime.getManifest().version;
	document.body.setAttribute(
		"sage-data",
		JSON.stringify({
			version: build, // legacy
			build,
			mv: __targetMV,
			browser: __targetBrowser,
		}),
	);
	console.log("[sage/manifest] injected");
});

register("storeScript", (script: string) =>
	chrome.storage.local.set({ script }),
);

register(
	"setProxy",
	(proxy: string) =>
		new Promise((resolve) => {
			chrome.runtime.sendMessage({ name: "setProxy", args: [proxy] }, resolve);
		}),
);

register("getCookieJar", getCookieJar);
register("setCookieJar", setCookieJar);
