import { info } from "../debug";
import { priorityTab, setPriorityTab } from "../tabPriority";
import { socket } from "../socketManager";

export default function clearActivity(resetTabPriority = false) {
	//* Send debug
	//* If resetTabPriority
	//* Emit clearActivity to app
	info("clearActivity.ts", `Clear Activity | ${resetTabPriority}`);
	if (resetTabPriority) {
		//* Try to clearInterval
		//* Set priority tab to null
		chrome.tabs.sendMessage(priorityTab, { tabPriority: false });
		setPriorityTab(null);
	}
	if (socket.connected) socket.emit("clearActivity");
}