if (typeof defaultLanguage == "undefined") {
  var defaultLanguage = null,
    currLanguage = null,
    loadingLanguages = true;

  //* Load languages if set
  loadLanguages(true);
}

function loadLanguages(initial = false) {
  return new Promise(function(resolve, reject) {
    if (defaultLanguage == null && initial) {
      chrome.storage.local.get("languages", ({ languages }) => {
        if (languages === undefined) {
          reject();
          return;
        }

        loadingLanguages = false;
        PMD_info("Translations loaded.");

        defaultLanguage = languages.default;
        currLanguage = languages.userLang;

        resolve();
        return;
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
    }, 5);
  });
}

function updateLanguages() {
  return new Promise(function(resolve, reject) {
    chrome.storage.sync.get("settings", async function(res) {
      var browsLang = chrome.i18n.getUILanguage();
      if (res.settings != undefined)
        browsLang = res.settings.language.value.toLowerCase();

      PMD_info(`Updating translations for en && ${browsLang}`);
      defaultLanguage = fetchJSON(
        "https://api.premid.app/v2/langFile/extension/en"
      ).catch(reject);

      var result = fetchJSON(
        `https://api.premid.app/v2/langFile/extension/${browsLang}`
      ).catch(_ => {});

      defaultLanguage = await defaultLanguage;
      result = await result;

      if (typeof result === "undefined") {
        PMD_error(
          `No language file found by code "${browsLang}", using default one instead`
        );
        currLanguage = defaultLanguage;
      } else currLanguage = result;

      resolve();

      chrome.storage.local.set({
        languages: {
          default: defaultLanguage,
          userLang: currLanguage
        }
      });
    });
  });
}

async function getString(string) {
  return loadLanguages().then(() => {
    if (typeof currLanguage[string] === "string") return currLanguage[string];

    if (
      typeof currLanguage[string] === "undefined" &&
      typeof defaultLanguage[string] === "string"
    )
      return defaultLanguage[string];

    PMD_error(`No translation found for ${string}`);
  });
}
