import { removeProxy, setProxy } from "./proxy";
import { register } from "./rpc";
import { getCookieJar, setCookieJar } from "./cookies";
import { removeCSP } from "./csp";
import { storeScript } from "./script";
import { sendBeacon } from "./request";

register("storeScript", storeScript);
register("setProxy", setProxy);
register("removeProxy", removeProxy);
register("getCookieJar", getCookieJar);
register("setCookieJar", setCookieJar);
register("removeCSP", removeCSP);
register("sendBeacon", sendBeacon);
