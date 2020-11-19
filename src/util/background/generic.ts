import { hideMetaTagPresences, priorityTab, tabPriority } from "../tabPriority";

import addDefaultPresences from "../functions/addDefaultPresences";
import clearActivity from "../functions/clearActivity";
import { connect } from "../socketManager";
import consoleHeader from "../functions/consoleHeader";
import hasAlphaBetaAccess from "../functions/hasAlphaBetaAccess";
import initSettings from "../functions/initSettings";
import { releaseType } from "../../config";
import { updatePresences } from "../presenceManager";
import { updateStrings } from "../langManager";

export async function start() {
	await consoleHeader();

	//* Check alpha/beta access if releasyType equals ALPHA/BETA
	if (["ALPHA", "BETA"].includes(releaseType)) await hasAlphaBetaAccess();

	chrome.browserAction.setBadgeText({ text: "!" });
	chrome.browserAction.setBadgeBackgroundColor({ color: "#e1e100" });

	//* Initialize settings, Add default presences, Update strings, Update presences
	//* Start updater intervals
	//*
	//* Connect to app
	await Promise.all([
		initSettings(),
		addDefaultPresences(),
		updateStrings(chrome.i18n.getUILanguage()),
		updatePresences()
	]);
	setInterval(updateStrings, 15 * 60 * 1000);
	setInterval(updatePresences, 15 * 60 * 1000);
	connect();
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
