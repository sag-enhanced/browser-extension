import * as esbuild from "esbuild";
import * as path from "node:path";
import * as fs from "node:fs/promises";

import * as manifest from "./static/manifest.json";
import * as manifestV2 from "./static/manifest.v2.json";
import * as manifestV3 from "./static/manifest.v3.json";

interface BuildTarget {
	name: string;
	bundlename: string;
	outname: string;
	manifest: 2 | 3;
	browser: "chromium" | "firefox";
}

async function buildJavascript(target: BuildTarget, isProd: boolean) {
	const names = ["background", "scripts/steam", "scripts/sage"];

	const promises: Array<Promise<esbuild.BuildResult>> = [];
	for (let name of names) {
		promises.push(
			esbuild.build({
				entryPoints: [`src/${name}/index.ts`],
				bundle: true,
				minify: isProd,
				outfile: `out/${target.outname}/${name}.js`,
				metafile: true,
				sourcemap: !isProd,
				loader: { ".css": "text" },
				// target: ["chrome51", "safari11", "firefox53", "edge18"],
				define: {
					chrome: target.browser === "chromium" ? "chrome" : "browser",
					__debugBuild: "" + !isProd,
					__targetMV: "" + target.manifest,
					__targetBrowser: JSON.stringify(target.browser),
				},
			}),
		);
	}
	const results = await Promise.all(promises);
	for (let i = 0; i < names.length; i++) {
		const result = results[i];
		for (const filename in result.metafile.outputs) {
			if (filename.endsWith(".map")) continue;
			const size = result.metafile.outputs[filename].bytes;
			console.log(`${size.toLocaleString().padStart(7)} ${filename}`);
		}
		if (!isProd) {
			await fs.writeFile(
				`out/${target.outname}/${names[i]}.meta.json`,
				JSON.stringify(result.metafile),
			);
		}
	}
}

async function buildManifest(target: BuildTarget, isProd: boolean) {
	const versionManifest = target.manifest === 2 ? manifestV2 : manifestV3;
	const finalManifest = {
		...manifest,
		...versionManifest,
	};
	if (!isProd) {
		const devURL = "*://localhost/*";
		finalManifest.content_scripts.forEach((x) => {
			if (x.js[0] === "scripts/sage.js" && !x.matches.includes(devURL))
				x.matches.push(devURL);
		});
		if ("host_permissions" in finalManifest)
			finalManifest.host_permissions.push(devURL);
		else finalManifest.permissions.push(devURL);
	}

	await fs.writeFile(
		`out/${target.outname}/manifest.json`,
		JSON.stringify(finalManifest, undefined),
	);
}

async function buildStatic(target: BuildTarget) {
	if (!(await fileExists(`out/${target.outname}/icons`)))
		await copyDirectory("static/icon", `out/${target.outname}/icon`);
}

(async () => {
	const isProd = process.env.NODE_ENV === "production";
	const targets: Array<BuildTarget> = [
		{
			name: "Chromium",
			bundlename: "sage.crx",
			outname: "chromium",
			manifest: 3,
			browser: "chromium",
		},
		{
			name: "Firefox",
			bundlename: "sage.xpi",
			outname: "firefox",
			manifest: 2,
			browser: "firefox",
		},
	];

	for (const target of targets) {
		console.log(`--- Building ${target.name} v${manifest.version} ---`);
		await buildJavascript(target, isProd);
		await buildManifest(target, isProd);
		await buildStatic(target);
		console.log();
	}
})();

// fs helpers
const fileExists = (name: string) =>
	fs.stat(name).then(
		() => true,
		() => false,
	);
export const copyDirectory = async (src: string, dest: string) => {
	const [entries] = await Promise.all([
		fs.readdir(src, { withFileTypes: true }),
		fs.mkdir(dest, { recursive: true }),
	]);

	await Promise.all(
		entries.map((entry) => {
			const srcPath = path.join(src, entry.name);
			const destPath = path.join(dest, entry.name);
			return entry.isDirectory()
				? copyDirectory(srcPath, destPath)
				: fs.copyFile(srcPath, destPath);
		}),
	);
};
