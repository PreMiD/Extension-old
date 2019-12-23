import { connect } from "../socketManager";
import { addPresence, updatePresences } from "../presenceManager";
import { getStorage } from "../functions/asyncStorage";
import { updateStrings } from "../langManager";
import initSettings from "../functions/initSettings";
import { tabPriority, priorityTab } from "../tabPriority";
import clearActivity from "../functions/clearActivity";

export async function start() {
  //* Initialize settings, Update strings, Update presences
  //* Start updater intervals
  //*
  //* Connect to app
  await Promise.all([initSettings(), updateStrings(), updatePresences()]);
  setInterval(updateStrings, 15 * 60 * 1000);
  setInterval(updatePresences, 1 * 60 * 1000);
  connect();

  //* Add default presences
  getStorage("local", "defaultAdded").then(({ defaultAdded }) => {
    //* return if already added
    //* Add default presences
    if (defaultAdded) return;
    addPresence([
      "YouTube",
      "YouTube Music",
      "Netflix",
      "Twitch",
      "SoundCloud"
    ]);
    chrome.storage.local.set({ defaultAdded: true });
  });
}

//* Update if update available
//* On Tab active
//* On Tab replace
//* On Tab remove
//* On Tab update
//* On Tab focus change
chrome.runtime.onUpdateAvailable.addListener(() => chrome.runtime.reload());
chrome.tabs.onActivated.addListener(() => tabPriority());
chrome.tabs.onReplaced.addListener((_, tabId) => {
  //* Only clear if tab is priorityTab
  if (priorityTab === tabId) clearActivity(true);
});
chrome.tabs.onRemoved.addListener(tabId => {
  //* Only clear if tab is priorityTab
  if (priorityTab === tabId) clearActivity(true);
});
chrome.tabs.onUpdated.addListener((_, changeInfo) => tabPriority(changeInfo));
chrome.windows.onFocusChanged.addListener(windowId => {
  //* Can't change window
  //* Run tabPriority
  if (windowId === -1) return;
  tabPriority();
});
