import { getStorage, setStorage } from "./asyncStorage";

import { addPresence } from "../presenceManager";

export default async function addDefaultPresences() {
	//* Add default presences
	let defaultAdded = (await getStorage("local", "defaultAdded")).defaultAdded
	//* return if already added
	//* Add default presences
	if (defaultAdded) return;
	const defaultPresences = [
		"YouTube",
		"YouTube Music",
		"Netflix",
		"Twitch",
		"SoundCloud"
	];
	await addPresence(defaultPresences);
	defaultAdded = true;

	let presences = (await getStorage("local", "presences")).presences
		.map(p => p.metadata.service);

	//* check that all requested presences have been installed
	for (const presence of defaultPresences) {
		if (!presences.includes(presence)) {
			defaultAdded = false;
			break;
		}
	}

	setStorage("local", {
		defaultAdded
	});
}
