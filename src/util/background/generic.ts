import { apiBase } from "../../background";
import { connect } from "../socketManager";
import { addPresence, updatePresences } from "../presenceManager";
import fetchJSON from "../functions/fetchJSON";
import { getStorage } from "../functions/asyncStorage";
import { updateStrings } from "../langManager";
import initSettings from "../functions/initSettings";
import { tabPriority, priorityTab } from "../tabPriority";
import checkAccess from "../functions/checkAccess";
import clearActivity from "../functions/clearActivity";

export async function start() {
  //* Initialize settings
  //* Run updater intervals
  //*
  //* If version endsWith DEV, devbuild
  //* Add all presences for testing purposes
  //* Connect to app
  //* Update strings
  //* Update presences
  await initSettings();
  await updateStrings();
  await updatePresences();
  setInterval(updateStrings, 15 * 60 * 1000);
  setInterval(updatePresences, 5 * 60 * 1000);
  if (chrome.runtime.getManifest().version_name.endsWith("-DEV"))
    addPresence(
      (await fetchJSON(`${apiBase}presences`)).map((p: any) => p.name)
    );
  checkAccess().then(connect);

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
  if (windowId === -1) return;

  tabPriority();
});
