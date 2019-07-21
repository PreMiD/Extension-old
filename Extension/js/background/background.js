var betaBuild = true,
  credentials = null;

//* Beta stuffs
chrome.webRequest.onBeforeRequest.addListener(
  body => {
    chrome.tabs.remove(body.tabId);
    credentials = Object.assign(
      ...body.url
        .slice(17, body.url.length)
        .split("&")
        .map(param => {
          return { [param.split("=")[0]]: param.split("=")[1] };
        })
    );

    fetch(`https://discordapp.com/api/users/@me`, {
      method: "GET",
      headers: new Headers({
        Authorization: `${credentials.token_type} ${credentials.access_token}`
      })
    })
      .catch(_ => {})
      .then(res => res.json())
      .then(body => {
        fetch(`https://api.premid.app/betaAccess/${body.id}`)
          .catch(_ => {})
          .then(res => res.json())
          .then(res => {
            if (res.access) {
              chrome.storage.local.set({ discordId: body.id });
              //* Create Options
              chrome.tabs.create({
                url: chrome.runtime.getURL("/html/tabs/index.html#/installed"),
                active: true
              });
            } else chrome.management.uninstallSelf();
          });
      });
  },
  { urls: ["http://PMD.BETA/*"] }
);

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
              chrome.tabs.create({
                active: true,
                url: chrome.runtime.getURL("html/tabs/index.html#updated")
              });
            }
          });
          break;
        case "install":
          if (betaBuild) {
            chrome.windows.create(
              {
                focused: true,
                url:
                  "https://discordapp.com/api/oauth2/authorize?response_type=token&client_id=503557087041683458&scope=identify",
                type: "popup",
                width: 400,
                height: 500,
                left: screen.width / 2 - 400 / 2,
                top: screen.height / 2 - 500 / 2
              },
              window => {
                chrome.windows.onRemoved.addListener(window1 => {
                  if (window.id === window1) {
                    if (!credentials) chrome.management.uninstallSelf();
                  }
                });
              }
            );

            return;
          }
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
                presences.filter(f =>
                  typeof f.url === "string"
                    ? getHost(currTab.url) === f.url
                    : f.url.includes(getHost(currTab.url))
                ).length > 0
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
      presences = presences.filter(f =>
        typeof f.url === "string"
          ? getHost(tab.url) === f.url
          : f.url.includes(getHost(tab.url))
      );

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
  if (presence.hasOwnProperty("iframe")) {
    chrome.tabs.executeScript(tabId, {
      file: "/js/util/devHelper.js",
      allFrames: true
    });
  }

  if (presence.hasOwnProperty("tmp")) {
    chrome.tabs.executeScript(tabId, {
      code: new String(
        "var PreMiD_Presence=true;" + presence.presenceJs
      ).toString()
    });
    if (presence.hasOwnProperty("iframe")) {
      chrome.tabs.executeScript(tabId, {
        code: presence.iframeJs,
        allFrames: true
      });
    }
  } else {
    chrome.tabs.executeScript(tabId, {
      code: new String(
        "var PreMiD_Presence=true;" +
          (await fetch(`${presence.source}presence.js`).then(async res =>
            res.text()
          ))
      ).toString()
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

  //* Presence Dev
  if (typeof data.loadPresence !== "undefined")
    socket.emit("watchPresenceFolder");
});
