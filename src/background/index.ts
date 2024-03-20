import { removeProxy, setProxy } from "./proxy";
import { register } from "./rpc";

register("setProxy", setProxy);
register("removeProxy", removeProxy);
