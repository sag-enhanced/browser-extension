import { bapi } from "../../_shared/env";
import ready from "../../lib/dom";

ready(() => {
	document.body.setAttribute(
		"sage-data",
		JSON.stringify({
			version: +bapi.runtime.getManifest().version,
			mv: __targetMV,
			browser: __targetBrowser,
		}),
	);
	console.log("[sage/manifest] injected");
});

addEventListener("sage-rpc", (ev: CustomEvent) => {
	const { name, args, uid } = ev.detail;
	console.log(`[rpc/cs] [${uid}] call`, name, args);
	bapi.runtime.sendMessage(ev.detail, (data) => {
		console.log(`[rpc/cs] [${uid}] response`, data);
		const options = {
			detail:
				__targetBrowser === "firefox"
					? cloneInto(data, document.defaultView)
					: data,
		};
		dispatchEvent(new CustomEvent("sage-rpc-result", options));
	});
});
