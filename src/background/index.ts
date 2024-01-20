import { bapi } from "../_shared/env";
import { getCookieJar, setCookieJar } from "./cookie";
import { backgroundFetch } from "./fetch";

interface RPCCall {
	name: string;
	args: Array<number>;
	uid: number;
}

const fns = {
	fetch: backgroundFetch,
	getCookieJar,
	setCookieJar,
	hello: async () => "world!",
};

bapi.runtime.onMessage.addListener(
	({ name, args, uid }: RPCCall, sender, send) => {
		console.log(`[rpc/bg] [${uid}]`, name, args);

		fns[name](...args, sender)
			.then((result: any) => {
				console.log(`[rpc/bg] [${uid}] return`, result);
				send({ uid, result });
			})
			.catch((error: Error) => {
				console.error(`[rpc/bg] [${uid}] error`, error);
				send({
					uid,
					error: {
						name: error.name,
						message: error.message,
						stack: error.stack,
					},
				});
			});

		return true;
	},
);

console.log("[sage] hello world!");
