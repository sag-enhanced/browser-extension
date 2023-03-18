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
        return { name: "SAGE", version: +manifest.version, browser: isFirefox ? "firefox" : "chromium", platform: navigator.userAgentData ? navigator.userAgentData.platform : navigator.platform };
    }
    
    const steamImpersonation = {
        "Accept-Language": "en-US",
        "X-Requested-With": "XMLHttpRequest"
    }
    
    async function requestVerifyEmail(email, captcha) {
        return await encodeResponse(
            await fetch("https://store.steampowered.com/join/ajaxverifyemail#sage", {
                method: "POST",
                mode: "cors",
                credentials: "include",
                body: new URLSearchParams(({ email, captchagid: captcha.gid, captcha_text: captcha.recaptcha ?? captcha.textcaptcha, elang: 0 })).toString(),
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
    
    const steamCookieLock = lock();
    async function createAccount(username, password, creationId) {
        console.log("[SAGE] [CREATE ACCOUNT] waiting for lock", creationId);
        await steamCookieLock();
        steamCookieLock.lock();
        console.log("[SAGE] [CREATE ACCOUNT] acquired lock", creationId);
        // we remove the cookie because otherwise we can get an outdated cookie
        // also for some reason, deleting cookies is not instant on firefox, so we
        // just do it again until its really gone
        let tries = 80;
        while(true) {
            const cookie1 = await new Promise(res => {
                chrome.cookies.remove({ name: "steamLoginSecure", url: "https://store.steampowered.com" }, res);
            });
            const cookie2 = await new Promise(res => {
                chrome.cookies.remove({ name: "steamLoginSecure", url: "https://.store.steampowered.com" }, res);
            });
            // firefox returns "null" once the cookie is deleted
            // chrome however returns a cookie object with no value?
            //   {name: 'steamLoginSecure', storeId: '0', url: 'https://store.steampowered.com/'}
            if((cookie1 === null || cookie1?.value === undefined) && (cookie2 === null || cookie2?.value === undefined)) break;
            await new Promise(res => setTimeout(res, 50));
            if(tries-- < 0) {
                console.log("[SAGE] [CREATE ACCOUNT] WARNING: can't delete login cookie", cookie);
                break;
            }
        }
        const response = await encodeResponse(
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
        tries = 40;
        const cookieJar = {login: "steamLoginSecure", sessionid: "sessionid"};
        while(tries > 0 && response.data.bSuccess) {
            for(const name in cookieJar) {
                const value = cookieJar[name];
                if(typeof value === "string") {
                    const cookie = await new Promise(res => {
                        chrome.cookies.get({ name: value, url: "https://store.steampowered.com" }, res);
                    });
                    if(!cookie) continue;
                    cookieJar[name] = cookie;
                }
            }
            if(!Object.values(cookieJar).some(x => typeof x === "string")) break;
            console.log("[SAGE] [CREATE ACCOUNT] no cookie yet, retrying in 50ms");
            await new Promise(res => setTimeout(res, 50));
            tries--;
        }
        
        console.log("[SAGE] [CREATE ACCOUNT] cookieJar", cookieJar)
        steamCookieLock.unlock();
        console.log("[SAGE] [CREATE ACCOUNT] released lock", creationId);
        return { response, cookieJar };
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

    async function disableSteamGuardRequest(cookieJar) {
        console.log("[SAGE] [STEAMGUARD DISABLE] waiting for lock");
        await steamCookieLock();
        steamCookieLock.lock();
        console.log("[SAGE] [STEAMGUARD DISABLE] acquired lock");

        console.log("[SAGE] [STEAMGUARD DISABLE] cookieJar", cookieJar);
        for(const cookie of Object.values(cookieJar)) {
            delete cookie.hostOnly;
            delete cookie.session;
            if(cookie.domain === ".store.steampowered.com") cookie.domain = "store.steampowered.com";
            cookie.url = `https://${cookie.domain}${cookie.path}`;

            await new Promise(res => chrome.cookies.set(cookie, res));
            console.log("[SAGE] [STEAMGUARD DISABLE] cookie set", cookie);
        }

        // enable steam guard first
        let sessionID;
        sessionID = await new Promise(res => {
            chrome.cookies.get({ name: "sessionid", url: "https://store.steampowered.com" }, res);
        });
        console.log("[SAGE] [STEAMGUARD DISABLE] session", sessionID);
        const enable = await fetch("https://store.steampowered.com/twofactor/manage_action", {
            method: "POST",
            mode: "cors",
            credentials: "include",
            body: new URLSearchParams({ action: "email", sessionid: sessionID.value, email_authenticator_check: "on" }).toString(),
            headers: {
                ...steamImpersonation,
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            }
        });

        sessionID = await new Promise(res => {
            chrome.cookies.get({ name: "sessionid", url: "https://store.steampowered.com" }, res);
        });
        const disable = await fetch("https://store.steampowered.com/twofactor/manage_action", {
            method: "POST",
            mode: "cors",
            credentials: "include",
            body: new URLSearchParams({ action: "actuallynone", sessionid: sessionID.value }).toString(),
            headers: {
                ...steamImpersonation,
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            }
        });

        steamCookieLock.unlock();
        console.log("[SAGE] [STEAMGUARD DISABLE] released lock");

        return {
            enable: await encodeResponse(enable),
            disable: await encodeResponse(disable),
        }
    }
    
    rpcFunctions = { about, requestVerifyEmail, verifyEmail, createAccount, sendWebhook, disableSteamGuardRequest };
    
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
            // our own request
            if(details.url.endsWith("#sage")) {
                console.log("[SAGE] HTTP own http request", details);
                details.requestHeaders = modifyHeaders(details.requestHeaders, {
                    "user-agent": STEAM_USERAGENT,
                    origin: null,
                    ...removeOthers, ...removeAllClientHints
                })
            }
            // main request to steam
            if(details.url.startsWith("https://store.steampowered.com/join/")) {
                const url = new URL(details.url);
                if(!url.hash.startsWith("#sage")) return;
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

rpcFunctions.about().then(about => {
    console.log(`[SAGE] Running version ${about.version} in ${about.browser} on ${about.platform}`);
});

/* helpers */

// taken from https://github.com/hansSchall/simple-promise-locks/blob/main/index.js
function lock(lockedDefault = false) {
    const waiting = [];
    let locked = lockedDefault;
    const lock = function () {
        return new Promise(
            resolve => {
                if (locked)
                    waiting.push(resolve);
                else
                    resolve();
            }
        );
    };
    lock.unlock = () => {
        locked = false;
        while (!locked && waiting.length) {
            waiting.shift()();
        }
    };
    lock.lock = (locked_) => {
        if (locked_ === false) lock.unlock();
        locked = true;
    };
    Object.defineProperty(lock, "locked", {
        get() {
            return locked;
        },
        set(locked) {
            lock.lock(locked);
        }
    });
    return lock;
};
