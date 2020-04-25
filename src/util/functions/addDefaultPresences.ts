import { getStorage } from "./asyncStorage";
import { addPresence } from "../presenceManager";

export default function addDefaultPresences() {
	//* Add default presences
	getStorage("local", "defaultAdded").then(({ defaultAdded }) => {
		//* return if already added
		//* Add default presences
		if (defaultAdded) return;
		addPresence([
			"YouTube",
			"YouTube Music",
			"Netflix",
			"Twitch",
			"SoundCloud"
		]);
		chrome.storage.local.set({
			defaultAdded: true
		});
	});
}
