import ready from "../../lib/dom";
import { getCaptchaToken, getGID } from "./captcha";
import { injectStyles } from "./styles";

ready(() => {
	if (location.hash !== "#sage" || !window.opener) return;
	console.log("[sage] hello world!");
	injectStyles();

	let intervalId: number;
	intervalId = setInterval(() => {
		const token = getCaptchaToken();
		console.log("[sage] captcha solved", token);
		if (!token) return;
		const gid = getGID();

		window.opener.postMessage(
			{
				source: "sage",
				captcha: { token, gid },
			},
			"*",
		);

		clearInterval(intervalId);
	}, 500) as unknown as number;
});
