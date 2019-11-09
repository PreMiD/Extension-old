import isEquivalent from "../functions/isEquivalent";
import cpObj from "../functions/cpObj";
import setActivity from "../functions/setActivity";
import { oldPresence } from "../tabPriority";
import { socket } from "../socketManager";

//* Some debug stuff to prevent timestamp jumping
export let oldObject: any = null;
export let oldActivity: any = null;

export function setOldObject(object: any) {
  oldObject = object;
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  handleiFrame(msg, sender);
  handlePresence(msg);
  handlePopup(msg);
});

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

function handlePresence(msg: any) {
  if (
    typeof msg.presence === "undefined" ||
    typeof msg.presence.presenceData === "undefined"
  )
    return;

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
    isEquivalent(check, check1) &&
    (oldObject.endTimestamp + 1 === msg.presence.presenceData.endTimestamp ||
      oldObject.endTimestamp - 1 === msg.presence.presenceData.endTimestamp ||
      oldObject.endTimestamp === msg.presence.presenceData.endTimestamp)
  ) {
  } else {
    oldActivity = msg.presence;
    setActivity(msg.presence);
  }

  oldObject = cpObj(msg.presence.presenceData);
  return;
}

function handlePopup(msg: any) {
  if (typeof msg.popup === "undefined" && typeof msg.tabs === "undefined")
    return;

  if (
    typeof msg.popup !== "undefined" &&
    typeof msg.popup.loadLocalPresence !== "undefined"
  ) {
    socket.emit("selectLocalPresence");
    return;
  }
  chrome.runtime.sendMessage({ socket: socket.connected });
}
