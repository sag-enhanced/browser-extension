// @ts-ignore
export const bapi: typeof chrome =
	__targetBrowser === "firefox" ? browser : chrome;
