import { getStorage } from "./functions/asyncStorage";
import fetchJSON from "./functions/fetchJSON";
import { apiBase } from "../background";
import clearActivity from "./functions/clearActivity";
import tabHasPresence from "./functions/tabHasPresence";
import injectPresence from "./functions/injectPresence";

export let priorityTab: number = null;
export let oldPresence: any = null;

let currTimeout: NodeJS.Timeout;

export async function tabPriority(info: any = undefined) {
  //* Get last focused window
  let lastFocusedWindow = await new Promise<chrome.windows.Window>(resolve =>
      chrome.windows.getLastFocused(resolve)
    ),
    activeTab = (
      await new Promise<chrome.tabs.Tab[]>(resolve =>
        chrome.tabs.query(
          { active: true, windowId: lastFocusedWindow.id },
          tabs => resolve(tabs)
        )
      )
    )[0],
    presence: presenceStorage = (await getStorage("local", "presences"))
      .presences;

  //* No point to continue if theres no url
  if (
    !activeTab.url ||
    activeTab.url.startsWith("chrome") ||
    activeTab.url.startsWith("edge")
  )
    return;

  //* Check if this website uses the PreMiD_Presence meta tag
  let pmdMetaTag = await new Promise(resolve =>
    chrome.tabs.executeScript(
      activeTab.id,
      {
        code: `try{document.querySelector('meta[name="PreMiD_Presence"]').content}catch(e){false}`
      },
      res => {
        if (!res) {
          resolve(undefined);
          return;
        }

        resolve(res[0]);
      }
    )
  );

  presence = presence.filter(p => {
    let res = null;

    //* If not enabled return false
    if (!p.enabled) return false;

    if (typeof p.metadata.regExp !== "undefined") {
      res = new URL(activeTab.url).hostname.match(
        new RegExp(p.metadata.regExp)
      );

      if (res === null) return false;
      else return res.length > 0;
    }

    if (Array.isArray(p.metadata.url))
      res =
        p.metadata.url.filter(url => new URL(activeTab.url).hostname === url)
          .length > 0;
    else res = new URL(activeTab.url).hostname === p.metadata.url;

    return res;
  });

  //* If PreMiD has no presence to inject here, inject one if pmdMetaTag has one
  if (presence.length === 0 && pmdMetaTag) {
    let { metadata } = await fetchJSON(`${apiBase}presences/${pmdMetaTag}`),
      prs: any = {
        metadata: metadata,
        presence: await fetch(
          `${apiBase}presences/${pmdMetaTag}/presence.js`
        ).then(res => {
          return res.text();
        }),
        enabled: true
      };
    if (metadata.iframe)
      prs.iframe = await fetch(
        `${apiBase}presences/${pmdMetaTag}/iframe.js`
      ).then(res => {
        return res.text();
      });

    presence = [prs];
  }

  //* Presence available for currUrl
  if (presence.length > 0) {
    //* Check if this tab already has a presence injected
    let tabHasPrs = await tabHasPresence(activeTab.id);

    //* If a tab is already prioritised, run 5 sec timeout
    if (priorityTab) {
      //* If timeout ends change priorityTab
      if (!currTimeout && priorityTab !== activeTab.id)
        currTimeout = setTimeout(async () => {
          //* Clear old activity
          clearActivity();
          //* Disable tabPriority on old priorityTab
          chrome.tabs.sendMessage(priorityTab, { tabPriority: false });
          //* Update tab to be this one
          priorityTab = activeTab.id;

          //* If tab has presence, tell to enable tabPriority, else inject and tell
          if (tabHasPrs)
            chrome.tabs.sendMessage(priorityTab, { tabPriority: true });
          else {
            await injectPresence(priorityTab, presence[0]);

            oldPresence = presence[0];
            chrome.tabs.sendMessage(priorityTab, { tabPriority: true });
          }

          //* Reset Timeout
          currTimeout = null;
        }, 5 * 1000);
      else {
        //* Check if presence injected, if not inject and send TabPriority
        if (
          priorityTab === activeTab.id &&
          !tabHasPrs &&
          info.status &&
          info.status === "complete"
        ) {
          //* Only clear presence if old presence != new presence
          if (
            oldPresence !== null &&
            oldPresence.metadata.service !== presence[0].metadata.service
          ) {
            //* Clear old presence from previous page
            clearActivity();
          }
          //* inject new presence
          await injectPresence(priorityTab, presence[0]);
          chrome.tabs.sendMessage(priorityTab, {
            tabPriority: true
          });
          oldPresence = presence[0];
        }
      }
    } else {
      oldPresence = presence[0];
      priorityTab = activeTab.id;

      if (!tabHasPrs) await injectPresence(priorityTab, presence[0]);

      chrome.tabs.sendMessage(priorityTab, {
        tabPriority: true
      });
    }
  } else {
    if (priorityTab === activeTab.id) {
      oldPresence = null;
      clearActivity(true);
    }
    clearTimeout(currTimeout);
    currTimeout = null;
  }
}

export function setPriorityTab(value: any) {
  priorityTab = value;
}
