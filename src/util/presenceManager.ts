import { getStorage } from "./functions/asyncStorage";
import { error, success } from "./debug";
import randomHex from "./functions/randomHex";
import axios from "axios";
import { apiBase } from "../config";

export async function presenceScience() {
	let identifier = (await getStorage("local", "identifier")).identifier,
		presences: presenceStorage = (await getStorage("local", "presences"))
			.presences;

	if (!identifier) {
		identifier = randomHex();
		chrome.storage.local.set({ identifier: identifier });
	}

	const headers = new Headers();
	headers.append("Content-Type", "application/json");

	axios("science", {
		baseURL: apiBase,
		data: {
			identifier: identifier,
			presences: presences.filter(p => !p.tmp).map(p => p.metadata.service),
			platform: await new Promise(resolve =>
				chrome.runtime.getPlatformInfo(info =>
					resolve({ os: info.os, arch: info.arch })
				)
			)
		},
		method: "POST",
		headers: headers
	});
}

export async function updatePresences() {
	presenceScience();

	let presenceVersions: Array<{ name: string; version: string; url: string }>,
		presences: presenceStorage = (await getStorage("local", "presences"))
			.presences;

	if (!presences || presences.length === 0) return;

	//* Catch fetch error
	try {
		presenceVersions = (await axios("presences/versions", { baseURL: apiBase }))
			.data;
	} catch (e) {
		error("presenceManager.ts", `Error while updating presences: ${e.message}`);
		return;
	}

	let currPresenceVersions = presences
			.filter(p => !p.tmp)
			.map(p => {
				return { name: p.metadata.service, version: p.metadata.version };
			}),
		presencesToUpdate = currPresenceVersions.filter(p =>
			presenceVersions.find(p1 => p1.name == p.name && p1.version !== p.version)
		);

	Promise.all(
		presencesToUpdate.map(async p => {
			let presenceIndex = presences.findIndex(
				//@ts-ignore
				p1 => p1.metadata.service === p.name && !p.tmp
			);

			const metadata = (
				await axios(`presences/${p.name}`, { baseURL: apiBase })
			).data.metadata;

			let files = (
				await Promise.all([
					(await axios(`${apiBase}presences/${p.name}/presence.js`)).data,
					metadata.iframe
						? (await axios(`${apiBase}presences/${p.name}/iframe.js`)).data
						: undefined
				])
			).filter(f => f);

			presences[presenceIndex].metadata = metadata;
			presences[presenceIndex].presence = files[0];
			// @ts-ignore
			if (files.length == 2) presences[presenceIndex].iframe = files[1];
		})
	).then(() => {
		chrome.storage.local.set({ presences: [...presences] }, () => {
			presencesToUpdate.map(p =>
				success(
					"presenceDevManager.ts",
					`Updated ${p.name} from v${p.version} to v${
						presenceVersions.find(p1 => p1.name === p.name).version
					}`
				)
			);
		});
	});
}

export async function addPresence(name: string | Array<string>) {
	let presences: presenceStorage = (await getStorage("local", "presences"))
		.presences;

	if (!presences) presences = [];
	//* Filter out tmp presences

	if (typeof name === "string") {
		if (presences.filter(p => !p.tmp).find(p => p.metadata.service === name)) {
			error("presenceManager", `Presence ${name} already added.`);
			return;
		}
	} else {
		let res = name.filter(
			s => !presences.map(p => p.metadata.service).includes(s)
		);

		if (res.length === 0) {
			error("presenceManager", "Presences already added.");
			return;
		} else name = res;
	}

	if (typeof name === "string") {
		axios(`presences/${name}`, { baseURL: apiBase })
			.then(async ({ data }) => {
				if (
					typeof data.metadata.button !== "undefined" &&
					!data.metadata.button
				)
					return;

				let res: any = {
					metadata: data.metadata,
					presence: await (await fetch(`${data.url}presence.js`)).text(),
					enabled: true
				};

				if (typeof data.metadata.iframe !== "undefined" && data.metadata.iframe)
					res.iframe = await (await fetch(`${data.url}iframe.js`)).text();

				presences.push(res);
				presences.map(p => {
					if(p.metadata.settings) {
						chrome.storage.local.set(JSON.parse(JSON.stringify({[`pSettings_${p.metadata.service}`]: p.metadata.settings })));
					}
				})
				chrome.storage.local.set({ presences: presences });
			})
			.catch(() => {});
	} else {
		let presencesToAdd: any = (
			await Promise.all(
				(
					await Promise.all(
						name.map(name => {
							return axios(`presences/${name}`, { baseURL: apiBase });
						})
					)
				).map(async ({ data }) => {
					if (
						typeof data.metadata.button !== "undefined" &&
						!data.metadata.button
					)
						return;

					let res: any = {
						metadata: data.metadata,
						presence: (await axios(`${data.url}presence.js`)).data,
						enabled: true
					}
					if (
						typeof data.metadata.iframe !== "undefined" &&
						data.metadata.iframe
					)
						res.iframe = (await axios(`${data.url}iframe.js`)).data;

					return res;
				})
			)
		).filter(p => typeof p !== "undefined");

		chrome.storage.local.set({ presences: presences.concat(presencesToAdd) });
		presences.concat(presencesToAdd).map(p => {
			if(p.metadata.settings) {
				chrome.storage.local.set(JSON.parse(JSON.stringify({[`pSettings_${p.metadata.service}`]: p.metadata.settings })));
			}
		})
	}
}

//* Only add these if is not background page
if (document.location.pathname !== "/_generated_background_page.html") {
	//* Add extension
	document.addEventListener("DOMContentLoaded", () => {
		if (document.querySelector("#app"))
			document.querySelector("#app").setAttribute("extension-ready", "true");
	});

	window.addEventListener("PreMiD_AddPresence", function(data: CustomEvent) {
		addPresence([data.detail]);
	});

	window.addEventListener("PreMiD_RemovePresence", async function(
		data: CustomEvent
	) {
		let { presences } = await getStorage("local", "presences");

		chrome.storage.local.set({
			presences: (presences as presenceStorage).filter(
				p => p.metadata.service !== data.detail
			)
		});
	});

	window.addEventListener("PreMiD_GetPresenceList", sendBackPresences);

	//* On presence change update
	chrome.storage.onChanged.addListener(key => {
		if (Object.keys(key)[0] === "presences") sendBackPresences();
	});
}

async function sendBackPresences() {
	let presences = (await getStorage("local", "presences"))
			.presences as presenceStorage,
		data = {
			detail: presences.filter(p => !p.tmp).map(p => p.metadata.service)
		};

	// @ts-ignore
	if (typeof cloneInto === "function")
		// @ts-ignore
		data = cloneInto(data, document.defaultView);

	let event = new CustomEvent("PreMiD_GetWebisteFallback", data);
	window.dispatchEvent(event);
}
