const strategy: Array<{
	selector: string;
	check?: (e: string) => boolean;
}> = [
	{ selector: "#g-recaptcha-response" },
	{ selector: "#captcha_text", check: (e) => e.length >= 6 },
];

export function getCaptchaToken() {
	for (const { selector, check } of strategy) {
		const element = document.querySelector(selector) as HTMLInputElement;
		if (element && element.value) {
			const token = element.value as string;
			if (!check || check(token)) {
				console.log("[sage/captcha] found captcha with strategy", selector);
				return token;
			}
		}
	}
}

export function getGID() {
	return (document.getElementById("captchagid") as HTMLInputElement).value;
}
