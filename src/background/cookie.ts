import { bapi } from "../_shared/env";
import { sleep } from "../_shared/sleep";

export async function getCookieJar(cookies: Array<Cookie>) {
	let works = false;
	while (!works) {
		works = true;
		for (const cookie of cookies) {
			if (cookie.value) continue;
			const biscuit = await new Promise<chrome.cookies.Cookie>((resolve) => {
				bapi.cookies.get(cookie, resolve);
			});
			if (biscuit && biscuit.value) cookie.value = biscuit.value;
			else works = false;
		}
		if (!works) {
			console.log("[sage/cookie] retrying in 50ms");
			await sleep(50);
		}
	}
	return cookies;
}

export async function setCookieJar(cookies: Array<Cookie>) {
	console.log("[sage/cookie] setting cookies", cookies);
	let works = false;
	while (!works) {
		works = true;
		for (const cookie of cookies) {
			const biscuit = await new Promise<chrome.cookies.Cookie>((resolve) => {
				if (cookie.value) bapi.cookies.set(cookie, resolve);
				// @ts-ignore
				else bapi.cookies.remove(cookie, resolve);
			});
			console.log("[sage/cookie]", cookie, biscuit);
			if (
				(!cookie.value && biscuit && biscuit.value) ||
				(cookie.value && biscuit?.value !== cookie.value)
			)
				works = false;
		}
		if (!works) {
			console.log("[sage/cookie] retrying in 50ms");
			await sleep(50);
		}
	}
	return cookies;
}

interface Cookie {
	name: string;
	url: string;
	value?: string;
}
