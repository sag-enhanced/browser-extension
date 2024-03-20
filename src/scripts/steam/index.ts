import ready from "../../lib/dom";

ready(async () => {
	if (location.hash !== "#sage") return;

	// technically we could just put the script to use in the url, but that'd allow for abuse
	// and phishing and much worse
	//
	// so the script needs to be set on our trusted domain (sage.party) first and then we can
	// use it in the extension
	const code = await chrome.storage.local.get("script");
	console.log("[sage/steam] injecting", code.script);

	// hacky way to bypass chrome-enforced extension CSP
	document.documentElement.setAttribute("onreset", code.script);
	document.documentElement.dispatchEvent(new CustomEvent("reset"));
	document.documentElement.removeAttribute("onreset");
});
