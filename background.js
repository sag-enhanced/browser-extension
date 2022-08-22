const browser = globalThis.chrome || globalThis.browser;
const isFirefox = !!globalThis.browser;

const activeTabIds = {};


/* RPC */

let rpcFunctions;
{
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
        const manifest = browser.runtime.getManifest();
        return { name: "SAGE", version: +manifest.version };
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
    
    rpcFunctions = { about, requestVerifyEmail, verifyEmail, createAccount, sendWebhook };
    
    browser.runtime.onConnect.addListener(port => {
        console.assert(port.name === "sage");
        console.log("[SAGE] tab connected", port);
        delete activeTabIds[port.sender.tab.id];
        port.onMessage.addListener(async msg => {
            console.log("[SAGE] [RPC]", msg);
            let result;
            try {
                result = await rpcFunctions[msg.name].apply(null, msg.args);
            } catch(e) {
                console.log("[SAGE] [RPC] errored", e);
                port.postMessage({ uid: msg.uid, error: e });
                return;
            }
            console.log("[SAGE] [RPC] success", result);
            port.postMessage({ uid: msg.uid, result });
        });
    });
}

/* SPOOFING */
{
    // a few constants
    // const STEAM_USERAGENT = "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_15_7; en-US; Valve Steam Client/default/0; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36";
    const STEAM_USERAGENT = "Mozilla/5.0 (Windows; U; Windows NT 10.0; en-US; Valve Steam Client/default/0; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36";
    const RECAPTCHA_SITEKEY = "6LdIFr0ZAAAAAO3vz0O0OQrtAefzdJcWQM2TMYQH";

    function modifyHeaders(currentHeaders, modifications) {
        for(const header of currentHeaders) {
            const name = header.name.toLowerCase()
            if(modifications[name] === undefined) continue;
            header.value = modifications[name];
            delete modifications[name];
        }
        for(const name in modifications) {
            if(modifications[name] !== null)
                currentHeaders.push({ name, value: modifications[name] });
        }
        return currentHeaders.filter(x => x.value !== null);
    }

    const removeOthers = { dnt: null, pragma: null, "cache-control": null, };
    const removeAllClientHints = {
        "sec-ch-ua": null, 
        "sec-ch-ua-arch": null, 
        "sec-ch-ua-bitness": null, 
        "sec-ch-ua-full-version": null, 
        "sec-ch-ua-full-version-list": null, 
        "sec-ch-ua-mobile": null, 
        "sec-ch-ua-model": null, 
        "sec-ch-ua-platform": null, 
        "sec-ch-ua-platform-version": null
    };

    browser.webRequest.onBeforeSendHeaders.addListener(
        (details) => {
            const origin = details.originUrl || details.initiator;
            if(!origin) return;
            const IS_STEAM_CAPTCHA = details.url.indexOf(RECAPTCHA_SITEKEY) >= 0;
            // main request to steam
            if(details.url.startsWith("https://store.steampowered.com/join/")) {
                const url = new URL(details.url);
                if(!url.hash.startsWith("#sage/")) return;
                activeTabIds[details.tabId] = true;
                details.requestHeaders = modifyHeaders(details.requestHeaders, {
                    "user-agent": STEAM_USERAGENT,
                    referer: "https://store.steampowered.com/join/?l=english",
                    "sec-fetch-site": "none",
                    cookie: null,
                    ...removeOthers, ...removeAllClientHints
                })
            }
            if(!activeTabIds[details.tabId]) return;
            // our own request - lets change cors headers and other
            if(origin.indexOf(browser.runtime.id) >= 0) {
                details.requestHeaders = modifyHeaders(details.requestHeaders, {
                    origin: "https://store.steampowered.com",
                    "sec-fetch-site": "same-origin",
                    "user-agent": STEAM_USERAGENT,
                    referer: "https://store.steampowered.com/join/?l=english",
                    ...removeOthers, ...removeAllClientHints
                })
            }
            // simple request, just need to spoof the useragent
            else if(
                details.url === "https://store.steampowered.com/join/refreshcaptcha/"
                || (details.url.startsWith("https://recaptcha.net/recaptcha/enterprise/bframe") && IS_STEAM_CAPTCHA)
            ) {
                details.requestHeaders = modifyHeaders(details.requestHeaders, {
                    "user-agent": STEAM_USERAGENT,
                    referer: "https://store.steampowered.com/join/?l=english",
                    ...removeOthers, ...removeAllClientHints
                })
            }
            // request to recaptcha
            else if(details.url.startsWith("https://recaptcha.net/recaptcha/enterprise/") && IS_STEAM_CAPTCHA) {
                details.requestHeaders = modifyHeaders(details.requestHeaders, {
                    "user-agent": STEAM_USERAGENT,
                    referer: "https://store.steampowered.com/join/?l=english",
                })
            }
            console.log("[SAGE] HTTP request", details);
            return { requestHeaders: details.requestHeaders };
        },
        {
            urls: [
                "*://store.steampowered.com/join/*",
                "*://recaptcha.net/recaptcha/enterprise/*"
            ]
        },
        isFirefox ? [ "blocking", "requestHeaders" ] : [ "blocking", "requestHeaders", "extraHeaders" ]
    );
}

rpcFunctions.about().then(data => {
    console.log(`[SAGE] Running version ${data.version}`);
});
