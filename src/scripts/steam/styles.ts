// @ts-ignore
import styles from "./styles.css";

export function injectStyles() {
	console.log("[sage/styles] injecting");
	const style = document.createElement("style");
	style.innerText = styles;
	document.head.appendChild(style);
}
