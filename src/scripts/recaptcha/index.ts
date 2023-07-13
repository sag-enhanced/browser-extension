import ready from "../../lib/dom";

const STEAM_SITEKEY = "6LdIFr0ZAAAAAO3vz0O0OQrtAefzdJcWQM2TMYQH";

ready(() => {
	if (!location.search.includes(STEAM_SITEKEY)) return;
	console.log("[sage/recaptcha] hello world!");
	let intervalId: number;
	intervalId = setInterval(() => {
		if (!document.querySelector(".recaptcha-checkbox-expired")) return;
		console.log("[sage/recaptcha] stuck detected; reloading");
		window.location.reload();
		clearInterval(intervalId);
	}, 500) as unknown as number;
});
