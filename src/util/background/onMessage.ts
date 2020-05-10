import { oldPresence } from "../tabPriority";

chrome.runtime.onMessage.addListener((msg, sender) =>
	handleiFrame(msg, sender)
);

function handleiFrame(msg: any, sender: chrome.runtime.MessageSender) {
	if (!oldPresence) return;

	//* Send "UpdateData" to iframe
	if (
		msg.iFrameUpdateData &&
		typeof oldPresence.metadata.iframe !== "undefined" &&
		oldPresence.metadata.iframe
	)
		chrome.tabs.sendMessage(sender.tab.id, { iFrameUpdateData: true });

	//* Send iFrameData back to presence
	if (msg.iFrameData)
		chrome.tabs.sendMessage(sender.tab.id, { iFrameData: msg.iFrameData });

	//* iFrame wants to know what presence it should inject (if available)
	if (!msg.iFrame) return;
	if (oldPresence === null) {
		chrome.tabs.sendMessage(sender.tab.id, { iFrame: false });
		return;
	}

	if (
		typeof oldPresence.metadata.iframe === "undefined" ||
		!oldPresence.metadata.iframe
	) {
		chrome.tabs.sendMessage(sender.tab.id, { iFrame: false });
		return;
	}

	chrome.tabs.sendMessage(sender.tab.id, {
		iFrame: oldPresence.iframe,
		iFrameRegExp: oldPresence.metadata.iFrameRegExp || ""
	});
}
