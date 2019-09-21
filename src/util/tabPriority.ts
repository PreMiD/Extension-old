import { getStorage } from "./functions/asyncStorage";
import { socket } from "./socketManager";
import { info, success } from "./debug";
import fetchJSON from "./functions/fetchJSON";
import { apiBase } from "../background";

let currTimeout: NodeJS.Timeout;

export let priorityTab = null;

export let oldPresence = null;

export async function tabPriority(reason = undefined, info = undefined) {
  //* Get last focused window
  let lastFocusedWindow = await new Promise<chrome.windows.Window>(resolve =>
      chrome.windows.getLastFocused(resolve)
    ),
    activeTab = (await new Promise<chrome.tabs.Tab[]>(resolve =>
      chrome.tabs.query(
        { active: true, windowId: lastFocusedWindow.id },
        tabs => resolve(tabs)
      )
    ))[0],
    presence = (await getStorage("local", "presences")).presences;

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
      res => resolve(res[0])
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
      prs = {
        metadata: metadata,
        presence: await await fetch(
          `${apiBase}presences/${pmdMetaTag}/presence.js`
        ).then(res => {
          return res.text();
        }),
        enabled: true
      };
    if (metadata.iframe)
      // @ts-ignore
      prs.iframe = await await fetch(
        `${apiBase}presences/${pmdMetaTag}/iframe.js`
      ).then(res => {
        return res.text();
      });

    presence = [prs];
  }

  //* Presence available for currUrl
  if (presence.length > 0) {
    //* Check if this tab already has a presence injected
    let tabHasPresence = (await new Promise(resolve => {
      chrome.tabs.executeScript(
        activeTab.id,
        {
          code: "try{PreMiD_Presence}catch(_){false}"
        },
        resolve
      );
    }))[0];

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
          if (tabHasPresence)
            chrome.tabs.sendMessage(priorityTab, { tabPriority: true });
          else {
            await inject(priorityTab, presence[0]);

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
          !tabHasPresence &&
          typeof info.status !== "undefined" &&
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
          await inject(priorityTab, presence[0]);
          chrome.tabs.sendMessage(priorityTab, {
            tabPriority: true
          });
          oldPresence = presence[0];
        }
      }
    } else {
      oldPresence = presence[0];
      priorityTab = activeTab.id;

      if (!tabHasPresence) await inject(priorityTab, presence[0]);

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

async function inject(tabId: number, presence: any) {
  return new Promise(resolve => {
    chrome.tabs.executeScript(
      tabId,
      {
        code: "let PreMiD_Presence=true;" + presence.presence,
        runAt: "document_start"
      },
      resolve
    );

    success(`Injected ${presence.metadata.service}`);
  });
}

export function clearActivity(resetTabPriority = false) {
  info(`Clear Activity | ${resetTabPriority}`);

  if (resetTabPriority) {
    //* Try to clearInterval
    chrome.tabs.sendMessage(priorityTab, { tabPriority: false });

    priorityTab = null;
  }

  //* Emit clearActivity to app
  socket.emit("clearActivity");
}

export async function tabHasPresence(tabId: number) {
  return (await new Promise(resolve => {
    chrome.tabs.executeScript(
      tabId,
      {
        code: "try{PreMiD_Presence}catch(_){false}"
      },
      resolve
    );
  }))[0];
}
