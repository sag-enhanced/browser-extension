const browser = globalThis.chrome || globalThis.browser;

async function encodeResponse(response) {
    const headers = Object.fromEntries(response.headers.entries());
    return {
        data: headers["content-type"].startsWith("application/json") ? await response.json() : await response.text(),
        headers,
        ok: response.ok,
        redirected: response.redirected,
        status: response.status,
        url: response.url,
    }
}

async function about() {
    return { name: "SAGE", version: "1.0.0" };
}

const steamImpersonation = {
    "Accept-Language": "en-US",
    "X-Requested-With": "XMLHttpRequest"
}

async function requestVerifyEmail(email, token, gid) {
    return await encodeResponse(
        await fetch("https://store.steampowered.com/join/ajaxverifyemail", {
            method: "POST",
            mode: "cors",
            credentials: "include",
            body: new URLSearchParams(({ email, captchagid: gid, captcha_text: token, elang: 0 })).toString(),
            headers: {
                ...steamImpersonation,
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            }
        })
    );
}
async function verifyEmail(link) {
    return await encodeResponse(
        await fetch(link, {
            mode: "cors",
            credentials: "include",
            headers: steamImpersonation
        })
    );
}

async function createAccount(username, password, creationId) {
    return await encodeResponse(
        fetch("https://store.steampowered.com/join/createaccount", {
            method: "POST",
            mode: "cors",
            credentials: "include",
            body: new URLSearchParams({accountname: username, password, count: 4, creation_sessionid: creationId}).toString(),
            headers: {
                ...steamImpersonation,
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            }
        })
    );
}
const events = { about, requestVerifyEmail, verifyEmail, createAccount };

browser.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        for(const header of details.requestHeaders) {
            if(header.name.toLowerCase() === "origin") {
                if(header.value !== `chrome-extension://${browser.runtime.id}`) return;
                header.value = "https://store.steampowered.com";
            } else if(header.name.toLowerCase() === "sec-fetch-site") {
                header.value = "same-origin";
            }
        }
        details.requestHeaders.push({ name: "referrer", value: "https://store.steampowered.com/join" });
        console.log("[SAGE] HTTP request", details);
        return { requestHeaders: details.requestHeaders };
    },
    { urls: [`chrome-extension://${browser.runtime.id}/*`, "*://store.steampowered.com/join/*"] },
    [ "blocking", "requestHeaders", "extraHeaders" ]
)


browser.runtime.onConnect.addListener(port => {
    console.assert(port.name === "sage");
    console.log("[SAGE] tab connected", port);
    port.onMessage.addListener(async msg => {
        console.log("[SAGE] [RPC]", msg);
        let result;
        try {
            result = await events[msg.name].apply(null, msg.args);
        } catch(e) {
            console.log("[SAGE] [RPC] errored", e);
            port.postMessage({ uid: msg.uid, error: e });
            return;
        }
        console.log("[SAGE] [RPC] success", result);
        port.postMessage({ uid: msg.uid, result });
    });
});


about().then(data => {
    console.log(`[SAGE] Running version ${data.version}`);
})
