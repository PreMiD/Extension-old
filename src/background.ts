import { connect, socket } from "./util/socketManager";
import { info } from "./util/debug";
import { updateStrings } from "./util/langManager";
import { addPresence, updatePresences } from "./util/presenceManager";
import {
  tabPriority,
  clearActivity,
  priorityTab,
  oldPresence
} from "./util/tabPriority";
import fetchJSON from "./util/functions/fetchJSON";
import checkAccess from "./util/functions/checkAccess";
import initSettings from "./util/functions/initSettings";
import { getStorage } from "./util/functions/asyncStorage";

export var apiBase = "https://api.premid.app/v2/";
export { socket };

if (chrome.runtime.getManifest().version_name.endsWith("-DEV")) {
  connect();

  //* Add all presences for testing purposes
  (async () => {
    addPresence(
      (await fetchJSON("https://api.premid.app/v2/presences")).map(p => p.name)
    );
  })();
}

//* Remove tmp Presence
getStorage("local", "presences").then(({ presences }) => {
  if (!presences) return;
  presences = presences.filter(p => !p.tmp);
  chrome.storage.local.set({ presences: presences });
});

setInterval(updateStrings, 15 * 60 * 1000);

initSettings();

setInterval(updatePresences, 5 * 60 * 1000);

//* Run this when extension enables (only if was disabled)
var extensionEnabled = setTimeout(() => {
  updateStrings();
  updatePresences();

  checkAccess()
    .then(connect)
    .catch(() => {
      chrome.management.uninstallSelf();
    });
}, 100);

chrome.storage.local.get("defaultAdded", ({ defaultAdded }) => {
  if (!defaultAdded) {
    //* Add some default presences
    addPresence([
      "YouTube",
      "YouTube Music",
      "Netflix",
      "Twitch",
      "SoundCloud"
    ]);
    chrome.storage.local.set({ defaultAdded: true });
  }
});

chrome.runtime.onInstalled.addListener(async details => {
  clearTimeout(extensionEnabled);
  updatePresences();

  await updateStrings();

  await checkAccess().catch(() => {
    chrome.management.uninstallSelf();
  });

  connect();

  switch (details.reason) {
    case "install": {
      //* Open installed tab
      chrome.tabs.create({
        active: true,
        index: 0,
        url: chrome.runtime.getURL("html/tabs/index.html#/installed")
      });

      //* Set lastVersion
      chrome.storage.local.set({
        lastVersion: chrome.runtime.getManifest().version_name
      });
    }
    case "update": {
      if (
        (await getStorage("local", "lastVersion")).lastVersion !==
        chrome.runtime.getManifest().version_name
      ) {
        //* Update performed, not reload
        chrome.storage.local.set({
          lastVersion: chrome.runtime.getManifest().version_name
        });
        //* Open updated tab
        chrome.tabs.create({
          active: true,
          index: 0,
          url: chrome.runtime.getURL("html/tabs/index.html#/updated")
        });
      }
    }
  }
});

//* Update if update available
chrome.runtime.onUpdateAvailable.addListener(() => {
  chrome.runtime.reload();
});

chrome.tabs.onActivated.addListener(() => tabPriority("activated"));
chrome.tabs.onReplaced.addListener((_, tabId) => {
  //* Only clear if tab is priorityTab
  if (priorityTab === tabId) clearActivity(true);
});
chrome.tabs.onRemoved.addListener(tabId => {
  //* Only clear if tab is priorityTab
  if (priorityTab === tabId) clearActivity(true);
});
chrome.tabs.onUpdated.addListener((_, changeInfo) => {
  tabPriority("updated", changeInfo);
});

chrome.windows.onFocusChanged.addListener(windowId => {
  //* Can't change window
  if (windowId === -1) return;

  tabPriority("focusChanged");
});

//* Some debug stuff to prevent timestamp jumping
var oldObject = null;
export var oldActivity = null;
chrome.runtime.onMessage.addListener((msg, sender) => {
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
  if (msg.iFrame) {
    if (oldPresence !== null) {
      if (
        typeof oldPresence.metadata.iframe !== "undefined" &&
        oldPresence.metadata.iframe
      )
        chrome.tabs.sendMessage(sender.tab.id, {
          iFrame: oldPresence.iframe,
          iFrameRegExp: oldPresence.metadata.iFrameRegExp || ""
        });
      else chrome.tabs.sendMessage(sender.tab.id, { iFrame: false });
    } else chrome.tabs.sendMessage(sender.tab.id, { iFrame: false });
  }

  if (typeof msg.presence !== "undefined") {
    //* PresenceData is defined
    if (typeof msg.presence.presenceData !== "undefined") {
      if (oldObject == null) {
        oldObject = cpObj(msg.presence.presenceData);
        oldActivity = msg.presence;
        setActivity(msg.presence);
        return;
      }

      //* Check differences and if there aren't any return

      var check = Object.assign({}, oldObject);
      delete check.startTimestamp;
      delete check.endTimestamp;

      var check1 = Object.assign({}, msg.presence.presenceData);
      delete check1.startTimestamp;
      delete check1.endTimestamp;

      if (
        (isEquivalent(check, check1) &&
          oldObject.endTimestamp + 1 ===
            msg.presence.presenceData.endTimestamp) ||
        oldObject.endTimestamp - 1 === msg.presence.presenceData.endTimestamp ||
        oldObject.endTimestamp === msg.presence.presenceData.endTimestamp
      ) {
      } else {
        oldActivity = msg.presence;
        setActivity(msg.presence);
      }

      oldObject = cpObj(msg.presence.presenceData);
      return;
    }
  }

  if (typeof msg.popup !== "undefined" || typeof msg.tabs !== "undefined") {
    if (
      typeof msg.popup !== "undefined" &&
      typeof msg.popup.loadLocalPresence !== "undefined"
    ) {
      socket.emit("selectLocalPresence");
      return;
    }
    chrome.runtime.sendMessage({ socket: socket.connected });
  }
});

//* Disable active presence if it just got disabled
chrome.storage.onChanged.addListener(async changes => {
  if (changes.presences && oldPresence && priorityTab) {
    var prs = (await getStorage("local", "presences")).presences.find(
      p => p.metadata.service === oldPresence.metadata.service
    );

    if (prs.enabled) {
      oldObject = null;
      chrome.tabs.sendMessage(priorityTab, {
        tabPriority: true
      });
    } else {
      chrome.tabs.sendMessage(priorityTab, {
        tabPriority: false
      });
      clearActivity(true);
    }
  }
});

export async function setActivity(presence: any, settings = undefined) {
  if (!settings) var { settings } = await getStorage("sync", "settings");
  var pTS = cpObj(presence);
  if (presence == null || !settings.enabled.value) return;

  if (settings.titleMenubar.value) {
    if (typeof pTS.trayTitle !== "undefined")
      pTS.trayTitle = pTS.trayTitle.trim();
  } else pTS.trayTitle = "";

  if (!settings.mediaKeys.value) pTS.mediaKeys = false;

  socket.emit("setActivity", pTS);
  info("updateData");
}

//* Credit http://adripofjavascript.com/blog/drips/object-equality-in-javascript.html
function isEquivalent(a: any, b: any) {
  // Create arrays of property names
  var aProps = Object.getOwnPropertyNames(a);
  var bProps = Object.getOwnPropertyNames(b);

  // If number of properties is different,
  // objects are not equivalent
  if (aProps.length != bProps.length) {
    return false;
  }

  for (var i = 0; i < aProps.length; i++) {
    var propName = aProps[i];

    // If values of same property are not equal,
    // objects are not equivalent
    if (a[propName] !== b[propName]) {
      return false;
    }
  }

  // If we made it this far, objects
  // are considered equivalent
  return true;
}

function cpObj(mainObj) {
  let objCopy: any = {}; // objCopy will store a copy of the mainObj
  let key;

  for (key in mainObj) {
    objCopy[key] = mainObj[key]; // copies each property to the objCopy object
  }
  return objCopy;
}
