import { priorityTab, oldPresence } from "../tabPriority";
import { getStorage } from "../functions/asyncStorage";
import clearActivity from "../functions/clearActivity";
import { setOldObject } from "./onConnect";

//* Disable active presence if it just got disabled
chrome.storage.onChanged.addListener(async changes => {
  if (!changes.presences || !oldPresence || !priorityTab) return;

  let prs = ((await getStorage("local", "presences"))
    .presences as presenceStorage).find(
    p => p.metadata.service === oldPresence.metadata.service
  );

  if (prs && prs.enabled) {
    setOldObject(null);
    chrome.tabs.sendMessage(priorityTab, {
      tabPriority: true
    });
  } else {
    chrome.tabs.sendMessage(priorityTab, {
      tabPriority: false
    });
    clearActivity(true);
  }
});
