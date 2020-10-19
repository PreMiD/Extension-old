import { start } from "./generic";
import { connect } from "../socketManager";
import { getStorage } from "../functions/asyncStorage";

const enable = () => start().then(connect);
//* Run this when extension enables (only if was disabled)
const onExtEnable = setTimeout(enable, 100);

chrome.runtime.onInstalled.addListener(async details => {
	//* ExtEnable
	//* Check access (beta)
	clearTimeout(onExtEnable);

	await start();

	switch (details.reason) {
		case "install":
			install();
			break;
		case "update":
			update();
			break;
	}
});

function install() {
	//* Open installed tab
	//* Set lastVersion
	chrome.tabs.create({
		active: true,
		index: 0,
		url: chrome.runtime.getURL("html/tabs/index.html#/installed")
	});
	chrome.storage.local.set({
		lastVersion: chrome.runtime.getManifest().version_name
	});
}

async function update() {
	//* Check extension update
	//* Updated
	//* Save update version
	//* Open updated tab
	if (
		parseInt(
			(await getStorage("local", "lastVersion")).lastVersion
				? (await getStorage("local", "lastVersion")).lastVersion
						.replace(/\./g, "")
						.slice(0, 3)
				: 0
		) <
		parseInt(
			chrome.runtime.getManifest().version_name.replace(/\./g, "").slice(0, 3)
		)
	) {
		chrome.storage.local.set({
			lastVersion: chrome.runtime.getManifest().version_name
		});
		chrome.tabs.create({
			active: true,
			index: 0,
			url: chrome.runtime.getURL("html/tabs/index.html#/updated")
		});
	}
}
