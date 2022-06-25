const port = chrome.runtime.connect({ name: "sage" });

console.log("[SAGE] [RPCBRIDGE] init");

port.onMessage.addListener(msg => {
    console.log("[SAGE] [RPCBRIDGE] [RESPONSE]", msg);
    window.dispatchEvent(new CustomEvent("sageRPCresult", { detail: msg }));
})

window.addEventListener("sageRPC", async (event) => {
    console.log("[SAGE] [RPCBRIDGE] [REQUEST]", event.detail);
    port.postMessage(event.detail);
});
