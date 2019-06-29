if (location.pathname !== "/_generated_background_page.html") {
  window.addEventListener("PreMiD_AddPresence", function(data) {
    addPresence(data.detail);
  });

  window.addEventListener("PreMiD_RemovePresence", function(data) {
    removePresence(data.detail);
  });

  window.addEventListener("PreMiD_GetPresenceList", function() {
    console.log(
      "%cPreMiD%c " + "Extension event call detected, sending data back...",
      "color: #ffffff; font-weight: 900; padding: 3px; margin: 3px; background: #596cae;",
      "color: #0000ff;"
    );
    chrome.storage.local.get("presences", result => {
      var event = new CustomEvent("PreMiD_GetWebisteFallback", {
        detail: result.presences
          .filter(p => p.tmp == undefined)
          .map(p => p.service)
      });
      window.dispatchEvent(event);

      return;
    });
  });
}

function addPresence(name) {
  chrome.storage.local.get("presences", async function(presences) {
    presences = presences.presences;

    if (
      presences.find(p => p.service == name && p.tmp == undefined) != undefined
    ) {
      PMD_error("Presence already added");
      return;
    }

    var json = await fetchJSON(`https://api.premid.app/presences/${name}`);

    if (json.error) {
      PMD_error(`Presence ${name} not found.`);
      return false;
    }

    var presenceMeta = await fetchJSON(json.url + "metadata.json");

    var presenceToAdd = {
      service: name,
      url: presenceMeta.url,
      source: `${json.url}`,
      color: presenceMeta.color,
      enabled: true
    };

    if (presenceMeta.iframe) presenceToAdd.iframe = presenceToAdd.iframe;

    presences.push(presenceToAdd);

    chrome.storage.local.set({ presences: presences });
    PMD_info(`Presence ${name} was installed successfuly.`);
  });
}

function removePresence(name) {
  chrome.storage.local.get("presences", async function(presences) {
    presences = presences.presences;

    var presenceToRemove = presences.find(
      p => p.service == name || p.tmp == undefined
    );

    if (presenceToRemove == undefined) {
      PMD_error("Presence not found");
      return false;
    }

    chrome.storage.local.set({
      presences: presences.filter(p => p.service != name || p.tmp != undefined)
    });
    PMD_info(`Presence ${name} was removed successfuly.`);
  });
}
