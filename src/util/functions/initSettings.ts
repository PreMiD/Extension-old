import { oldActivity } from "../background/onConnect";
import { info } from "../debug";
import { socket } from "../socketManager";
import { priorityTab } from "../tabPriority";
import { getStorage } from "./asyncStorage";
import clearActivity from "./clearActivity";
import setActivity from "./setActivity";

let settings: any = null;

export default async function() {
	let presences = (await getStorage("local", "presences")).presences;
	if (!presences)
		await new Promise(resolve =>
			chrome.storage.local.set({ presences: [] }, resolve)
		);

	settings = (await getStorage("sync", "settings")).settings;
	if (typeof settings === "undefined") settings = {};

	initSetting("enabled", "popup.setting.enabled", 0);
	initSetting("autoLaunch", "popup.setting.autoLaunch", 1);
	initSetting("mediaKeys", "popup.setting.mediaControl", 2);
	initSetting("titleMenubar", "popup.setting.titleMenubar", 3);

	await new Promise(resolve =>
		chrome.storage.sync.set({ settings: settings }, resolve)
	);

	info("initSettings.ts", "Initialized settings");
}

chrome.storage.onChanged.addListener(changes => {
	if (changes.settings) {
		let nSettings = Object.assign(
			{},
			...Object.keys(changes.settings.newValue).map(k => {
				return { [k]: changes.settings.newValue[k].value };
			})
		);

		if (nSettings.enabled) setActivity(oldActivity, changes.settings.newValue);
		else if (priorityTab !== null) clearActivity(true);

		if (socket.connected) socket.emit("settingUpdate", nSettings);
		info("initSettings.ts", "Settings update");
	}

	if (changes.presences?.newValue && changes.presences?.oldValue) {
		const oldValue = changes.presences.oldValue,
			changedPresences = changes.presences.newValue.filter(
				np =>
					oldValue.find(ov => ov.metadata.service === np.metadata.service)
						.metadata.version !== np.metadata.version
			);

		changedPresences.forEach(updatedPresence => {
			const settings = updatedPresence.metadata.settings;

			chrome.storage.local.get(
				`pSettings_${updatedPresence.metadata.service}`,
				storageSettings => {
					storageSettings =
						storageSettings[`pSettings_${updatedPresence.metadata.service}`] ||
						[];

					settings.forEach(setting => {
						const storageSetting = storageSettings.find(
							s => s.id === setting.id
						);

						if (storageSetting && storageSetting.value !== null) {
							if (typeof setting.value === typeof storageSetting.value) {
								setting.value = storageSetting.value;
							} else if (storageSetting.multiLanguage) {
								setting = storageSetting;
							}
						}
					});

					chrome.storage.local.set(
						JSON.parse(
							JSON.stringify({
								[`pSettings_${updatedPresence.metadata.service}`]: settings
							})
						),
						() => {
							info(
								"initSettings.ts",
								`Updated setting storage of ${updatedPresence.metadata.service}`
							);
						}
					);
				}
			);
		});
	}
});

function initSetting(
	setting: string,
	string: string,
	position: number,
	option: any = true,
	show = true
) {
	if (typeof settings[setting] === "undefined")
		cOption(setting, string, position, option, show);
}

function cOption(
	setting: string,
	string: string,
	position: number,
	option: boolean,
	show: boolean
) {
	if (!settings[setting]) {
		settings[setting] = {
			string: string,
			value: option,
			position: position
		};

		if (show) settings[setting].show = show;
	}
}
