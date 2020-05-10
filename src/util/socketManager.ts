import * as socketIo from "socket.io-client";
import presenceDevManager from "./functions/presenceDevManager";
import setActivity from "./functions/setActivity";
import { error, info, success } from "./debug";
import { getStorage } from "./functions/asyncStorage";
import { oldActivity } from "./background/onConnect";
import { priorityTab } from "./tabPriority";
import { requiredAppVersion } from "../config";

//* Create socket
export let socket = socketIo.connect("http://localhost:3020", {
	autoConnect: false
});

export const connect = () => socket.open();

export let appVersion = 0;

let appVersionTimeout: number = null;

socket.on("connect", async () => {
	chrome.browserAction.setBadgeText({ text: "" });

	//* Tell app to give us its version
	//* Start timeout if we don't receive version response
	socket.emit("getVersion");
	appVersionTimeout = window.setTimeout(() => {
		//* No response got, most likely old version
		appVersion = -1;
		error("socketManager.ts", "Unsupported app version");
	}, 5000);

	//TODO move this in a file or so
	let settings = (await getStorage("sync", "settings")).settings;
	settings = Object.assign(
		{},
		...Object.keys(settings).map(k => {
			return { [k]: settings[k].value };
		})
	);
	socket.emit("settingUpdate", settings);
});

socket.on("receiveVersion", (version: number) => {
	clearTimeout(appVersionTimeout);
	appVersion = version;

	if (!supportedAppVersion()) {
		error("socketManager.ts", "Unsupported app version");
		return;
	} else info("socketManager.ts", "Supported app version");

	if (oldActivity) setActivity(oldActivity);

	success("socketManager.ts", "Connected to application");
	chrome.runtime.sendMessage({ socket: socket.connected });

	if (priorityTab !== null)
		chrome.tabs.sendMessage(priorityTab, { tabPriority: true });
});

socket.on("disconnect", () => {
	chrome.browserAction.setBadgeText({ text: "!" });
	chrome.browserAction.setBadgeBackgroundColor({ color: "#e1e100" });

	error("socketManager.ts", "Disconnected from application");
	chrome.runtime.sendMessage({ socket: socket.connected });

	chrome.storage.local.get("presences", ({ presences }) => {
		presences = (presences as presenceStorage).filter(p => !p.tmp);
		chrome.storage.local.set({ presences: presences });
	});

	if (priorityTab !== null)
		chrome.tabs.sendMessage(priorityTab, { tabPriority: false });
});

socket.on("localPresence", presenceDevManager);

socket.on(
	"discordUser",
	async (
		user: {
			avatar: string;
			bot: boolean;
			discriminator: string;
			flags: number;
			id: string;
			premium_type: string;
			username: string;
		} | null
	) => {
		if (!user) return;
		chrome.storage.local.set({ discordUser: user });
	}
);

export function supportedAppVersion() {
	if (appVersion >= requiredAppVersion || appVersion === 0) {
		chrome.browserAction.setBadgeText({ text: "" });
		return true;
	} else {
		chrome.browserAction.setBadgeText({ text: "!" });
		chrome.browserAction.setBadgeBackgroundColor({ color: "#ff5050" });
		return false;
	}
}
