const fns = {};

chrome.runtime.onMessage.addListener(
	({ name, args }: { name: string; args: Array<any> }, sender, send) => {
		console.log(`[rpc/bg]`, name, args);

		fns[name](...args, sender)
			.then((result: any) => {
				console.log(`[rpc/bg] return`, result);
				send({ result });
			})
			.catch((error: Error) => {
				console.error(`[rpc/bg] error`, error);
				send({
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

export function register(name: string, fn: Function) {
	fns[name] = fn;
}
