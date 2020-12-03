import { error, info } from "../debug";
import { updateStrings } from "../langManager";
import { updatePresences } from "../presenceManager";
import { getStorage } from "./asyncStorage";

// import { oldPresence, priorityTab } from "../tabPriority";
//TODO RECODE
// @ts-nocheck

let errors = [];
export default async function(files: any) {
	errors = [];
	info("presenceDevManager.ts", "Local Presence update");

	files = files.files;
	let metadata = files.find(f => f.file.toLowerCase() === "metadata.json"),
		presence = files.find(f => f.file.toLowerCase() === "presence.js"),
		iframe = files.find(f => f.file.toLowerCase() === "iframe.js");

	if (!metadata) errors.push("No metadata.json found.");
	else {
		metadata = metadata.contents;

		if (typeof metadata.iframe !== "undefined" && metadata.iframe && !iframe)
			errors.push("No iframe.js found.");

		if (typeof metadata.service === "undefined")
			errors.push("property service not defined.");

		if (typeof metadata.author !== "object")
			errors.push("property author not defined.");
		else {
			if (typeof metadata.author.name === "undefined")
				errors.push("property author.name not defined.");

			if (typeof metadata.author.id === "undefined")
				errors.push("property author.id not defined.");
		}

		if (typeof metadata.description !== "object")
			errors.push("property description not defined.");
		else {
			if (typeof metadata.description.en === "undefined")
				errors.push("property description.en not defined.");
		}

		if (typeof metadata.url === "undefined")
			errors.push("property url not defined.");
	}
	if (!presence) errors.push("No presence.js found.");

	errors.map(err => error("presenceDevManager.ts", err, true));

	let presences: presenceStorage = (await getStorage("local", "presences"))
		.presences;

	presences = presences.filter(p => !p.tmp);

	let addedPresence = presences.find(
		p => p.metadata.service === metadata.service
	);
	if (addedPresence) addedPresence.enabled = false;

	let tmpPr: any = {
		enabled: true,
		metadata: metadata,
		presence: presence.contents,
		tmp: true
	};

	if (typeof metadata.iframe !== "undefined" && metadata.iframe)
		tmpPr.iframe = iframe.contents;

	if (tmpPr.metadata.settings)
		chrome.storage.local.set({
			[`pSettings_${tmpPr.metadata.service}`]: tmpPr.metadata.settings
		});

	presences.push(tmpPr);

	chrome.storage.local.set({ presences: presences });
	updateStrings(chrome.i18n.getUILanguage());

	// reload all tabs of any presence in development mode
	for (let i = 0; i < presences.length; i++) {
		if (presences[i].tmp) {
			let updatedPresence = presences[i];

			chrome.tabs.query(
				{
					windowType: "normal"
				},
				tabs => {
					for (let j = 0; j < tabs.length; j++) {
						let tabUrl = new URL(tabs[j].url);

						if (
							(typeof updatedPresence.metadata.url === "string" &&
								updatedPresence.metadata.url === tabUrl.hostname) ||
							(updatedPresence.metadata.url instanceof Array &&
								updatedPresence.metadata.url.includes(tabUrl.hostname)) ||
							(updatedPresence.metadata.regExp &&
								new RegExp(updatedPresence.metadata.regExp).test(tabUrl.href))
						) {
							chrome.tabs.reload(tabs[j].id, { bypassCache: true }, () => {
								console.info(
									`Presence ${updatedPresence.metadata.service} updated, tab reloaded!`
								);
							});
						}
					}
				}
			);
		}
	}

	// if (oldPresence && priorityTab) chrome.tabs.reload(priorityTab);
}
