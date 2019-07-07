//* Get Directory system of Extension
chrome.runtime.getPackageDirectoryEntry(function(root) {
  //* GetDirectory "presenceDev" folder
  root.getDirectory("presenceDev", { create: false }, function(dir) {
    if (dir) {
      PMD_info("Validating PresenceDev folder...");

      var reader = dir.createReader();
      reader.readEntries(function(results) {
        //* Check if it contains files
        if (results.length > 0) {
          if (!results.find(f => f.name == "presence.js"))
            PMD_error("Missing file: presence.js");

          root.getFile("presenceDev/metadata.json", { create: false }, function(
            fileEntry
          ) {
            fileEntry.file(function(file) {
              var reader = new FileReader();

              reader.onloadend = function(e) {
                try {
                  validateMetaData(JSON.parse(this.result), results);
                } catch (e) {
                  PMD_error("Could not parse metadata.json\n" + e);
                }
                PMD_info("Validated presenceDev folder.");
              };
              reader.readAsText(file);
            });
          });
        } else PMD_error("Found PresenceDev folder but its empty.");
      });
    }
  });
});

//TODO Rewrite
var validateErrors = [];
function validateMetaData(json, files) {
  if (json.hasOwnProperty("author")) {
    if (!json.author.hasOwnProperty("name"))
      validateErrors.push("Missing property: author.name");
    if (!json.author.hasOwnProperty("id"))
      validateErrors.push("Missing property: author.id");
  } else validateErrors.push("Missing property: author");

  checkProperty(json, "service");
  checkProperty(json, "description");
  checkProperty(json, "url");
  checkProperty(json, "version");
  checkProperty(json, "logo");
  checkProperty(json, "color");
  checkProperty(json, "tags");

  if (
    files.find(f => f.file == "iframe.js") != undefined &&
    !json.hasOwnProperty("iframe")
  )
    validateErrors.push(
      "Found iframe.js but property not found in metadata.json"
    );

  if (
    files.find(f => f.file == "iframe.js") == undefined &&
    json.hasOwnProperty("iframe")
  )
    validateErrors.push(
      "Found iframe property in metadata.json but not iframe.js"
    );

  if (validateErrors.length > 0) {
    validateErrors.map(error => PMD_error(error));
    return;
  }

  chrome.storage.local.get(["presences"], function(res) {
    var presences = res.presences,
      currLocalPresence = 0;

    if (presences) {
      currLocalPresence = presences.findIndex(presence =>
        presence.hasOwnProperty("tmp")
      );
    } else presences = [];

    var presenceNew = {
      service: json.service,
      color: json.color,
      url: json.url,
      enabled: true,
      presenceJs: files.find(f => f.file === "presence.js").contents,
      tmp: true
    };

    if (json.hasOwnProperty("iframe")) {
      presenceNew.iframe = true;
      presenceNew.iframeJs = files.find(f => f.file === "iframe.js").contents;
    }

    if (currLocalPresence > -1) {
      presences[currLocalPresence] = presenceNew;
    } else {
      presences.push(presenceNew);
    }

    chrome.storage.local.set({ presences: presences });
  });
}

function checkProperty(json, property) {
  if (!json.hasOwnProperty(property))
    validateErrors.push(`Missing property: ${property}`);
}
