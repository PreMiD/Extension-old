if (typeof defaultLanguage == "undefined") {
  var defaultLanguage = null,
    currLanguage = null,
    loadingLanguages = true;

  //* Load languages if set
  loadLanguages(true);
}

async function loadLanguages(initial = false) {
  return new Promise(function(resolve, reject) {
    if (defaultLanguage == null && initial) {
      chrome.storage.sync.get("settings", function(res) {
        if (res.settings == undefined) return;

        chrome.storage.local.get("languages", function(res1) {
          if (res1.languages == undefined) {
            reject();
            return;
          }
          loadingLanguages = false;
          PMD_info("Translations have been loaded.");

          defaultLanguage = res1.languages.default;
          currLanguage =
            res1.languages[res.settings.language.value.toLowerCase()];
          resolve();
          return;
        });
      });
    }

    if (!loadingLanguages) {
      resolve();
      return;
    }
    var interval = setInterval(() => {
      if (!loadingLanguages) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });
}

async function updateLanguages() {
  return new Promise(function(resolve, reject) {
    chrome.storage.sync.get("settings", async function(res) {
      var browsLang = chrome.i18n.getUILanguage();
      if (res.settings != undefined)
        browsLang = res.settings.language.value.toLowerCase();

      PMD_info(`Updating translations for en && ${browsLang}`);
      defaultLanguage = await fetchJSON(`https://api.premid.app/langFile/en`);
      var result = await fetchJSON(
        `https://api.premid.app/langFile/${browsLang}`
      );

      if (result.error != undefined) {
        PMD_error(
          `No language file found by code "${browsLang}", using default one instead`
        );
        currLanguage = defaultLanguage;
      } else currLanguage = result;

      chrome.storage.local.set({
        languages: {
          default: defaultLanguage,
          [browsLang]: currLanguage
        }
      });
      resolve();
    });
  });
}

async function getString(string) {
  await loadLanguages();
  if (typeof currLanguage[string] === "string") return currLanguage[string];
  if (
    typeof currLanguage[string] === "undefined" &&
    typeof defaultLanguage[string] === "string"
  )
    return defaultLanguage[string];
  PMD_error(`No translation found for ${string}`);
}
