import fetchJSON from "./functions/fetchJSON";
import { getStorage } from "./functions/asyncStorage";
import { error, success } from "./debug";

var apiBase = "https://api.premid.app/v2/";

export async function updatePresences() {
  var presenceVersions = await fetchJSON(apiBase + "presences/versions"),
    { presences } = await getStorage("local", "presences");

  if (!presences) return;

  var currPresenceVersions = presences.map(p => {
    return { name: p.metadata.service, version: p.metadata.version };
  });

  var presencesToUpdate = currPresenceVersions.filter(p =>
    presenceVersions.find(p1 => p1.name == p.name && p1.version !== p.version)
  );

  presencesToUpdate.map(p => {
    presences = presences.filter(p1 => p1.metadata.service !== p.name);
    chrome.storage.local.set({ presences }, () => {
      addPresence(p.name).then(() => success(`Updated ${p.name}`));
    });
  });
}

export async function addPresence(name: string | Array<string>) {
  var { presences } = await getStorage("local", "presences");
  if (!presences) presences = [];
  //* Filter out tmp presences
  presences = presences.filter(p => !p.tmp);

  if (typeof name === "string") {
    if (presences.find(p => p.metadata.service === name)) {
      error(`Presence ${name} already added.`);
      return;
    }
  } else {
    var res = name.filter(
      s => !presences.map(p => p.metadata.service).includes(s)
    );

    if (res.length === 0) {
      error("Presences already added.");
      return;
    } else name = res;
  }

  if (typeof name === "string") {
    fetchJSON(`${apiBase}presences/${name}`)
      .then(async json => {
        var res = {
          metadata: json.metadata,
          presence: await (await fetch(`${json.url}presence.js`)).text(),
          enabled: true
        };

        if (typeof json.metadata.iframe !== "undefined" && json.metadata.iframe)
          // @ts-ignore
          res.iframe = await (await fetch(`${json.url}iframe.js`)).text();

        presences.push(res);
        chrome.storage.local.set({ presences: presences });
      })
      .catch(err => {});
  } else {
    var presencesToAdd: any = await Promise.all(
      (await Promise.all(
        name.map(name => {
          return fetchJSON(`${apiBase}presences/${name}`).catch(err => {});
        })
      ))
        .filter(p => typeof p !== "undefined")
        .map(async p => {
          var res = {
            metadata: p.metadata,
            presence: await (await fetch(`${p.url}presence.js`)).text(),
            enabled: true
          };
          if (typeof p.metadata.iframe !== "undefined" && p.metadata.iframe)
            // @ts-ignore
            res.iframe = await (await fetch(`${p.url}iframe.js`)).text();

          return res;
        })
    );

    chrome.storage.local.set({ presences: presences.concat(presencesToAdd) });
  }
}

//* Only add these if is not background page
if (document.location.pathname !== "/_generated_background_page.html") {
  //* Add extension
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#app").setAttribute("extension-ready", "true");
  });

  window.addEventListener("PreMiD_AddPresence", function(data) {
    // @ts-ignore
    addPresence([data.detail]);
  });

  window.addEventListener("PreMiD_RemovePresence", async function(data) {
    var { presences } = await getStorage("local", "presences");

    chrome.storage.local.set({
      presences: presences.filter(
        // @ts-ignore
        p => p.metadata.service !== data.detail && !p.tmp
      )
    });
  });

  window.addEventListener("PreMiD_GetPresenceList", sendBackPresences);

  //* On presence change update
  chrome.storage.onChanged.addListener(key => {
    if (Object.keys(key)[0] === "presences") sendBackPresences();
  });
}

async function sendBackPresences() {
  var { presences } = await getStorage("local", "presences");

  var event = new CustomEvent("PreMiD_GetWebisteFallback", {
    detail: presences.filter(p => !p.tmp).map(p => p.metadata.service)
  });
  window.dispatchEvent(event);
}
