import cpObj from "../functions/cpObj";
import isEquivalent from "../functions/isEquivalent";
import setActivity from "../functions/setActivity";
import { socket, supportedAppVersion } from "../socketManager";

//* Some debug stuff to prevent timestamp jumping
export let oldObject: any = null;
export let oldActivity: any = null;

export function setOldObject(object: any) {
	oldObject = object;
}

chrome.runtime.onConnect.addListener(function(port) {
	handleTabs(port);
	handlePopup(port);
	handlePresence(port);
});

function handleTabs(port: chrome.runtime.Port) {
	if (port.name === "tabs") {
		const sendResponse = () => {
			port.postMessage({
				connected: socket.connected
			});
		};

		sendResponse();

		socket.on("connect", sendResponse);
		socket.on("disconnect", sendResponse);

		port.onDisconnect.addListener(() => {
			socket.removeListener("connect", sendResponse);
			socket.removeListener("disconnect", sendResponse);
		});
	}
}

function handlePopup(port: chrome.runtime.Port) {
	if (port.name === "popup") {
		const sendResponse = () => {
			port.postMessage({
				connected: socket.connected,
				appVersionSupported: supportedAppVersion()
			});
		};

		sendResponse();

		socket.on("connect", sendResponse);
		socket.on("disconnect", sendResponse);

		port.onDisconnect.addListener(() => {
			socket.removeListener("connect", sendResponse);
			socket.removeListener("disconnect", sendResponse);
		});

		port.onMessage.addListener(msg => {
			if (msg.action === "loadLocalPresence")
				if (socket.connected) socket.emit("selectLocalPresence");
		});
	}
}

function handlePresence(port: chrome.runtime.Port) {
	if (port.name === "contentScript") {
		port.onMessage.addListener(msg => {
			if (
				typeof msg.presence === "undefined" ||
				typeof msg.presence.presenceData === "undefined"
			)
				return;

			if (typeof msg.presence.presenceData.largeImageKey !== "undefined")
				msg.presence.presenceData.largeImageText = `${
					chrome.runtime.getManifest().name
				} v${chrome.runtime.getManifest().version_name}`;

			if (oldObject == null) {
				oldObject = cpObj(msg.presence.presenceData);
				oldActivity = msg.presence;
				setActivity(msg.presence);
				return;
			}

			//* Check differences and if there aren't any return

			let check = cpObj(oldObject);
			delete check.startTimestamp;
			delete check.endTimestamp;

			let check1 = cpObj(msg.presence.presenceData);
			delete check1.startTimestamp;
			delete check1.endTimestamp;

			if (
				!(
					isEquivalent(check, check1) &&
					(oldObject.endTimestamp + 1 ===
						msg.presence.presenceData.endTimestamp ||
						oldObject.endTimestamp - 1 ===
							msg.presence.presenceData.endTimestamp ||
						oldObject.endTimestamp === msg.presence.presenceData.endTimestamp)
				)
			) {
				oldActivity = msg.presence;
				setActivity(msg.presence);
			}

			//* No presence update when either startTimestamp / endTimestamp removed
			if (
				(oldObject.startTimestamp !== undefined &&
					msg.presence.presenceData.startTimestamp === undefined) ||
				(oldObject.startTimestamp === undefined &&
					msg.presence.presenceData.startTimestamp !== undefined) ||
				(oldObject.endTimestamp !== undefined &&
					msg.presence.presenceData.endTimestamp === undefined) ||
				(oldObject.endTimestamp === undefined &&
					msg.presence.presenceData.endTimestamp !== undefined)
			) {
				oldActivity = msg.presence;
				setActivity(msg.presence);
			}

			oldObject = cpObj(msg.presence.presenceData);
			return;
		});
	}
}
