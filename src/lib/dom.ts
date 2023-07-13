export default function ready(cb: () => void) {
	if (document.readyState !== "loading") setTimeout(cb, 0);
	else {
		let callback: () => void;
		callback = () => {
			removeEventListener("DOMContentLoaded", callback);
			cb();
		};
		addEventListener("DOMContentLoaded", callback);
	}
}
