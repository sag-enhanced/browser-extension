declare global {
	// firefox content-script only apis
	var cloneInto: (a: any, b: any) => any;

	// build flags
	var __debugBuild: boolean;

	// build target
	var __targetMV: 2 | 3;
	var __targetBrowser: "chromium" | "firefox";
}

export {};
