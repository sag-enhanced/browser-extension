const browser = globalThis.chrome || globalThis.browser;
const isFirefox = !!globalThis.browser;

let activeGenerations = 0;

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
    return { name: "SAGE", version: 1 };
}

const steamImpersonation = {
    "Accept-Language": "en-US",
    "X-Requested-With": "XMLHttpRequest"
}

async function requestVerifyEmail(email, token, gid) {
    if(activeGenerations > 0) activeGenerations--;
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
        await fetch("https://store.steampowered.com/join/createaccount", {
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

async function sendWebhook(webhook, payload) {
    return await encodeResponse(
        await fetch(webhook, {
            method: "POST",
            mode: "cors",
            credentials: "include",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json"
            }
        })
    );
}

const events = { about, requestVerifyEmail, verifyEmail, createAccount, sendWebhook };
const STEAM_USERAGENT = "Mozilla/5.0 (Windows; U; Windows NT 10.0; en-US; Valve Steam Client/default/0; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36";
// const STEAM_USERAGENT = "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_15_7; en-US; Valve Steam Client/default/0; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36";

browser.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        const origin = details.originUrl || details.initiator;
        if(!origin) return;
        console.log("request from", new URL(origin).hostname, origin, details, activeGenerations)
        if(
            origin.indexOf(browser.runtime.id) >= 0
            || details.url === "https://store.steampowered.com/join/refreshcaptcha/"
            || (details.url.startsWith("https://recaptcha.net/recaptcha/enterprise/bframe") && origin === "https://store.steampowered.com")
        ) {
            // this is our own request to steam, so lets impersonate the steam client perfectly
            for(const header of details.requestHeaders) {
                if(header.name.toLowerCase() === "origin") {
                    header.value = "https://store.steampowered.com";
                } else if(header.name.toLowerCase() === "sec-fetch-site") {
                    header.value = "same-origin";
                } else if(header.name.toLowerCase() === "user-agent") {
                    header.value = STEAM_USERAGENT;
                }
            }
            details.requestHeaders = details.requestHeaders.filter(x => (
                !x.name.toLowerCase().startsWith("sec-ch-")
                && x.name.toLowerCase() !== "cache-control"
                && x.name.toLowerCase() !== "dnt"
                && x.name.toLowerCase() !== "referer"
                && x.name.toLowerCase() !== "pragma"
            ));
            details.requestHeaders.push({ name: "referer", value: "https://store.steampowered.com/join/?l=english" });
        } else if(
            (new URL(origin).hostname === "recaptcha.net" && activeGenerations > 0) 
            || (details.url.startsWith("https://recaptcha.net/recaptcha/enterprise/anchor") && details.url.indexOf("6LdIFr0ZAAAAAO3vz0O0OQrtAefzdJcWQM2TMYQH") >= 0)
            || details.url.startsWith("https://store.steampowered.com/join/")
        ) {
            if(details.url.startsWith("https://recaptcha.net/recaptcha/enterprise/anchor"))
                activeGenerations++;
            for(const header of details.requestHeaders) {
                if(header.name.toLowerCase() === "user-agent") {
                    header.value = STEAM_USERAGENT;
                } else if(header.name.toLowerCase() === "referer") {
                    header.value = "https://store.steampowered.com/join/?l=english";
                }
            }
            if(details.url.startsWith("https://store.steampowered.com/join/")) {
                for(const header of details.requestHeaders) {
                    if(header.name.toLowerCase() === "sec-fetch-site") {
                        header.value = "none";
                    }
                }
                details.requestHeaders = details.requestHeaders.filter(x => (
                    !x.name.toLowerCase().startsWith("sec-ch-")
                    && x.name.toLowerCase() !== "cache-control"
                    && x.name.toLowerCase() !== "dnt"
                    && x.name.toLowerCase() !== "referer"
                    && x.name.toLowerCase() !== "pragma"
                ));
            }
        }
        console.log("[SAGE] HTTP request", details);
        return { requestHeaders: details.requestHeaders };
    },
    {
        urls: [
            `chrome-extension://${browser.runtime.id}/*`,
            "*://store.steampowered.com/join/*",
            "*://recaptcha.net/recaptcha/enterprise/*"
        ]
    },
    isFirefox ? [ "blocking", "requestHeaders" ] : [ "blocking", "requestHeaders", "extraHeaders" ]
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
