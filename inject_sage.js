const port = chrome.runtime.connect({ name: "sage" });
const isFirefox = !!globalThis.browser;

console.log("[SAGE] [RPCBRIDGE] init");

const manifest = chrome.runtime.getManifest();
const injectManifest = () => {
    console.log("[SAGE] [MANIFEST] injecting manifest info");
    document.body.setAttribute("sage-data", JSON.stringify({
        version: +manifest.version
    }));
};

console.log(`[SAGE] [MANIFEST] scheduled manifest injection: ${document.readyState}`);
if(document.readyState === "complete") {
    setTimeout(injectManifest, 0);
} else {
    addEventListener("DOMContentLoaded", injectManifest);
}

const customEventFactory = isFirefox ? (
    (name, options) => {
        return new CustomEvent(
            name, 
            { detail: cloneInto(options.detail, document.defaultView) }
        );
    }
) : (
    (name, options) => new CustomEvent(name, options)
)

port.onMessage.addListener(msg => {
    console.log("[SAGE] [RPCBRIDGE] [RESPONSE]", msg);
    window.dispatchEvent(customEventFactory("sageRPCresult", { detail: msg }));
})

window.addEventListener("sageRPC", async (event) => {
    console.log("[SAGE] [RPCBRIDGE] [REQUEST]", event.detail);
    port.postMessage(event.detail);
});
