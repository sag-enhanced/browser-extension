import { removeProxy, setProxy } from "./proxy";
import { register } from "./rpc";
import { getCookieJar, setCookieJar } from "./cookies";

register("setProxy", setProxy);
register("removeProxy", removeProxy);
register("getCookieJar", getCookieJar);
register("setCookieJar", setCookieJar);
