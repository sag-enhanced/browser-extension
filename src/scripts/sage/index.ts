import ready from "../../lib/dom";
import { register } from "../../lib/rpc";

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
