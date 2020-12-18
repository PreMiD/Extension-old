export function getStorage(
	type: "local" | "sync",
	name: string | Array<string>
) {
	return new Promise<any>(resolve =>
		chrome.storage[type].get(name, items => resolve(items))
	);
}

export function setStorage(
	type: "local" | "sync",
	items: Object
) {
	return new Promise<void>(resolve =>
		chrome.storage[type].set(items, resolve)
	);
}
