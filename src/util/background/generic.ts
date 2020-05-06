import { connect } from "../socketManager";
import { addPresence, updatePresences } from "../presenceManager";
import { getStorage } from "../functions/asyncStorage";
import { updateStrings } from "../langManager";
import initSettings from "../functions/initSettings";
import clearActivity from "../functions/clearActivity";
import { tabPriority, priorityTab, hideMetaTagPresences } from "../tabPriority";
import Axios from "axios";
import { releaseType, apiBase } from "../../config";

export async function start() {
	if (releaseType !== "RELEASE") {
		const { authorizedBetaAlpha } = await getStorage(
			"local",
			"authorizedBetaAlpha"
		);

		if (!authorizedBetaAlpha) {
			let redirectURL =
				"https://cpoegcmgabanfledhkjdicdclgpmghog.chromiumapp.org";
			// @ts-ignore
			if (typeof browser !== "undefined")
				// @ts-ignore
				redirectURL = await browser.identity.getRedirectURL();

			const allowedAccess = await new Promise(resolve =>
				chrome.identity.launchWebAuthFlow(
					{
						url: `https://discordapp.com/api/oauth2/authorize?response_type=token&client_id=503557087041683458&scope=identify&redirect_uri=${redirectURL}`,
						interactive: true
					},
					async responseUrl => {
						if (
							!responseUrl ||
							!responseUrl.match(/(&access_token=[\d\w]+)/g)
						) {
							//* So chrome shuts up
							chrome.runtime.lastError;
							resolve();
							return;
						}

						const accessToken = responseUrl
							.match(/(&access_token=[\d\w]+)/g)[0]
							.replace("&access_token=", "");

						const dUser = (
							await Axios("https://discordapp.com/api/users/@me", {
								headers: { Authorization: `Bearer ${accessToken}` }
							})
						).data;

						let allowedAccess: boolean;
						if (releaseType === "BETA") {
							allowedAccess = (await Axios(apiBase + "betaAccess/" + dUser.id))
								.data.access;
						} else if (releaseType === "ALPHA")
							allowedAccess = (await Axios(apiBase + "alphaAccess/" + dUser.id))
								.data.access;

						resolve(allowedAccess);
					}
				)
			);

			chrome.storage.local.set({ authorizedBetaAlpha: allowedAccess });
		}
	}

	chrome.browserAction.setBadgeText({ text: "!" });
	chrome.browserAction.setBadgeBackgroundColor({ color: "#e1e100" });

	//* Initialize settings, Update strings, Update presences
	//* Start updater intervals
	//*
	//* Connect to app
	await Promise.all([initSettings(), updateStrings(), updatePresences()]);
	setInterval(updateStrings, 15 * 60 * 1000);
	setInterval(updatePresences, 1 * 60 * 1000);
	connect();

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
		chrome.storage.local.set({ defaultAdded: true });
	});
}

//* Update if update available
//* On Tab active
//* On Tab replace
//* On Tab remove
//* On Tab update
//* On Tab focus change
chrome.runtime.onUpdateAvailable.addListener(() => chrome.runtime.reload());
chrome.tabs.onActivated.addListener(() => tabPriority());
chrome.tabs.onReplaced.addListener((_, tabId) => {
	//* Only clear if tab is priorityTab
	if (priorityTab === tabId) {
		clearActivity(true);
		hideMetaTagPresences();
	}
});
chrome.tabs.onRemoved.addListener(tabId => {
	//* Only clear if tab is priorityTab
	if (priorityTab === tabId) {
		clearActivity(true);
		hideMetaTagPresences();
	}
});
chrome.tabs.onUpdated.addListener((_, changeInfo) => tabPriority(changeInfo));
chrome.windows.onFocusChanged.addListener(windowId => {
	//* Can't change window
	//* Run tabPriority
	if (windowId === -1) return;
	tabPriority();
});
