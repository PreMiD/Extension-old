import { info } from "../debug";
import { priorityTab, setPriorityTab } from "../tabPriority";
import { socket } from "../socketManager";

export default function clearActivity(resetTabPriority = false) {
  info("clearActivity.ts", `Clear Activity | ${resetTabPriority}`);

  if (resetTabPriority) {
    //* Try to clearInterval
    chrome.tabs.sendMessage(priorityTab, { tabPriority: false });

    setPriorityTab(null);
  }

  //* Emit clearActivity to app
  socket.emit("clearActivity");
}
