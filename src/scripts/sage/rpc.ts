const fns = {};

addEventListener("sage-rpc", (ev: CustomEvent) => {
	const { name, args, uid } = ev.detail;
	console.log(`[rpc/cs] [${uid}] call`, name, args);

	const respond = (data: any) => {
		const options = {
			detail:
				__targetBrowser === "firefox"
					? cloneInto(data, document.defaultView)
					: {
							uid,
							...data,
					  },
		};
		dispatchEvent(new CustomEvent("sage-rpc-result", options));
	};

	fns[name](...args).then(
		(result) => {
			console.log(`[rpc/cs] [${uid}] response`, result);
			respond({ result });
		},
		(error: Error) => {
			console.error(`[rpc/cs] [${uid}] error`, error);
			respond({
				error: {
					name: error.name,
					message: error.message,
					stack: error.stack,
				},
			});
		},
	);
});

export function register(name: string, fn: Function) {
	fns[name] = fn;
}
