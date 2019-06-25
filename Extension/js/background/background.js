var pagePresenceUrl = null;

function updateAppSettings() {
  chrome.storage.local.get("settingsAppUpdated", function(result) {
    if (!result.settingsAppUpdated) {
      saveSettings();
    }
  });
}

setInterval(updateAppSettings, 1000);

//* Extension installed/updated
chrome.runtime.onInstalled.addListener(function(details) {
  //* Set presences array if not defined
  chrome.storage.local.get("presences", res => {
    if (typeof res.presences === "undefined")
      chrome.storage.local.set({ presences: [] });
  });

  //* Update language strings
  initSettings().then(
    updateLanguages().then(() => {
      switch (details.reason) {
        case "update":
          //* Load last saved version string
          chrome.storage.local.get("lastVersion", function(result) {
            //* Check if it is a new version or not
            if (result.lastVersion != details.previousVersion) {
              //* Save new version to prevent errors
              chrome.storage.local.set({
                lastVersion: details.previousVersion
              });
              //TODO Open updated tab
              //TODO Auto add default presences
            }
          });
          break;
        case "install":
          //* Create Options
          chrome.tabs.create({
            url: chrome.runtime.getURL("/html/tabs/index.html#/installed"),
            active: true
          });
          //TODO Auto add default presences
          break;
      }
    })
  );
  //* Set connection to false
  chrome.storage.local.set({ connected: false });
});

var priorityTab,
  lastTab,
  tabPriorityLock = 0;
function tabPriority() {
  //* Get all active tabs
  chrome.windows.getCurrent({ populate: true }, function(window) {
    var currTab = window.tabs.filter(tab => tab.active)[0];

    //* Only use tabPriority on websites
    if (
      !currTab.url.startsWith("http://") &&
      !currTab.url.startsWith("https://")
    )
      return;
    //* Check if meta tag presence is found and retrieve name and inject presence
    chrome.tabs.executeScript(
      currTab.id,
      {
        code: `try{document.querySelector('meta[name="PreMiD_Presence"]').content}catch(e){}`
      },
      async function(result) {
        if (!result || result.length == 0 || result[0] == null) return;
        var presenceMeta = result[0];
        chrome.tabs.executeScript(
          currTab.id,
          { code: `try{PreMiD_Presence}catch(e){false}` },
          async function(result) {
            if (result[0] || currTab.status != "complete") return;

            var res = await fetchJSON(
              `https://api.premid.app/presences/${presenceMeta}`
            );
            if (res.error != undefined) return;
            var metadata = await fetchJSON(`${res.url}metadata.json`);
            metadata.source = res.url;
            metadata.service = res.name;

            injectPresence(currTab.id, metadata);
            pagePresenceUrl = metadata.url;
          }
        );
      }
    );

    //* Load all presences
    chrome.storage.local.get(["presences"], function(result) {
      var presences = [];
      //* Add page presence if available to presences array
      if (
        pagePresenceUrl != null &&
        presences.findIndex(p => p.url == pagePresenceUrl) == -1
      ) {
        result.presences.push({
          url: pagePresenceUrl,
          enabled: true
        });
        if (!result.presences)
          result.presences = [{ url: pagePresenceUrl, enabled: true }];
      }
      if (!result.presences) return;

      //* Keep only enabled ones
      presences = result.presences.filter(f => f.enabled);
      chrome.storage.sync.get("settings", function(result) {
        var settings = result.settings;

        if (settings.enabled.value == false) {
          if (priorityTab) {
            chrome.tabs.sendMessage(priorityTab, { tabPriority: false });
            priorityTab = null;
          }
          return;
        }

        //* If there are any proceed
        if (presences.length > 0) {
          //* If priorityTab == current tab reset priorityLock
          if (priorityTab != currTab.id) {
            //* If tab change reset tabPriorityLock
            if (lastTab != currTab.id) {
              tabPriorityLock = 0;
              lastTab = currTab.id;
            }

            //* Loop through presences
            for (var i = 0; presences.length > i; i++) {
              //* active tab url contains presence url
              if (
                getHost(currTab.url).indexOf(getHost(presences[i].url)) > -1
              ) {
                //* Update priorityTab when 5 seconds passed else increase count
                if (tabPriorityLock >= 4) {
                  //* Send tab message to stop its intervals
                  if (priorityTab)
                    chrome.tabs.sendMessage(priorityTab, {
                      tabPriority: false
                    });

                  priorityTab = currTab.id;
                } else tabPriorityLock++;
              }
            }
          } else tabPriorityLock = 0;
        }
      });
    });
  });

  if (priorityTab) {
    //* Tell tab to enable intervals
    chrome.tabs.sendMessage(priorityTab, { tabPriority: true });
  }
}

//* Clear presence if tab closed
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  chrome.storage.local.get("presences", function(data) {
    if (priorityTab == tabId) {
      pagePresenceUrl = null;
      if (socket.connected)
        socket.emit("updateData", {
          trayTitle: "",
          hidden: true
        });
      return;
    }
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status == "complete") {
    //* Clear presence if tab url changed to non Presence
    chrome.storage.local.get("presences", function(data) {
      var presences = data.presences;
      if (!presences) return;

      //* Only keep enabled ones
      presences = presences.filter(f => f.enabled);

      //* Only keep presence that we need for url
      presences = presences.filter(f => getHost(tab.url) == f.url);

      if (tabId == priorityTab && presences.length == 0) {
        pagePresenceUrl = null;
        if (socket.connected)
          socket.emit("updateData", {
            trayTitle: "",
            hidden: true
          });
        return;
      }

      if (presences.length == 0) return;

      var presence = presences[0];

      chrome.tabs.executeScript(
        tabId,
        { code: `try{PreMiD_Presence}catch(e){false}` },
        function(result) {
          if (result[0]) return;
          injectPresence(tabId, presence);
        }
      );
    });
  }
});

function getHost(url) {
  var hostname;

  //* Remove protocol if there is one
  if (url.indexOf("//") > -1) {
    hostname = url.split("/")[2];
  } else {
    hostname = url.split("/")[0];
  }

  //* Remove port
  hostname = hostname.split(":")[0];
  //* Remove query string
  hostname = hostname.split("?")[0];

  return hostname;
}

async function injectPresence(tabId, presence) {
  if (presence.hasOwnProperty("tmp")) {
    chrome.tabs.executeScript(tabId, {
      file: "/presenceDev/presence.js"
    });
    if (presence.hasOwnProperty("iframe")) {
      chrome.tabs.executeScript(tabId, {
        file: "/presenceDev/iframe.js",
        allFrames: true
      });
    }
  } else {
    chrome.tabs.executeScript(tabId, {
      code: await fetch(`${presence.source}presence.js`).then(async res =>
        res.text()
      )
    });
    if (presence.hasOwnProperty("iframe")) {
      chrome.tabs.executeScript(tabId, {
        code: await fetch(`${presence.source}iframe.js`).then(async res =>
          res.text()
        ),
        allFrames: true
      });
    }
  }

  if (presence.hasOwnProperty("iframe")) {
    chrome.tabs.executeScript(tabId, {
      file: "../util/devHelper.js",
      allFrames: true
    });
  }

  chrome.tabs.executeScript(tabId, {
    code:
      'if(typeof PreMiD_Presence === "undefined") var PreMiD_Presence = true;'
  });

  PMD_info(`${presence.service} injected.`);
}

//* Forward the presence data received from Presence script to application
chrome.runtime.onMessage.addListener(function(data, sender) {
  if (data.presence != undefined) {
    PMD_info("Sending Presence Data to Application");
    if (typeof data.presence.presenceData.largeImageKey !== "undefined")
      data.presence.presenceData.largeImageText =
        chrome.runtime.getManifest().name +
        " v" +
        chrome.runtime.getManifest().version;
    socket.emit("updateData", data.presence);
  }

  if (data.iFrameData != undefined && priorityTab != null) {
    PMD_info("Sending iFrame data to presence");
    chrome.tabs.sendMessage(priorityTab, data);
  }
});
