var settings = null;

function updateSetting(setting, value) {
  chrome.storage.sync.get("settings", function(result) {
    settings = result.settings;

    settings[setting].value = value;
    chrome.storage.sync.set({ settings: settings });
  });
}
async function initSettings() {
  return new Promise(function(resolve, reject) {
    //* Retrieve options if set
    chrome.storage.sync.get("settings", function(result) {
      settings = result.settings;

      if (!settings) {
        PMD_info("Creating default settings...");
        settings = {
          enabled: {
            string: "popup.setting.enabled",
            value: true,
            position: 0
          },
          mediaKeys: {
            string: "popup.setting.mediaControl",
            value: true,
            position: 1
          },
          titleMenubar: {
            string: "popup.setting.titleMenubar",
            value: true,
            position: 2
          },
          autoLaunch: {
            string: "popup.setting.autoLaunch",
            value: true,
            position: 3
          },
          language: {
            string: "popup.setting.language",
            value: convertLangCode(chrome.i18n.getUILanguage()),
            show: false,
            position: 4
          }
        };

        chrome.storage.sync.set({ settings: settings }, function() {
          updateLanguages();
          loadLanguages();
          resolve();
        });

        saveSettings();
        return;
      }

      initSetting("enabled", "popup.setting.enabled", 0);
      initSetting("autoLaunch", "popup.setting.autoLaunch", 1);
      initSetting("mediaKeys", "popup.setting.mediaKeys", 2);
      initSetting("titleMenubar", "popup.setting.titleMenubar", 3);
      initSetting(
        "language",
        convertLangCode(chrome.i18n.getUILanguage()),
        4,
        "popup.setting.language",
        false
      );
    });
  });
}

function initSetting(setting, string, position, option = true, show = true) {
  if (!settings) {
    chrome.storage.sync.get("settings", function(result) {
      settings = result.settings;

      if (settings && !settings[setting])
        cOption(setting, string, position, option, show);
    });
  } else if (settings && !settings[setting])
    cOption(setting, string, position, option, show);
}

function cOption(setting, string, position, option, show) {
  if (!settings[setting]) {
    PMD_info(`Creating option for ${setting}`);
    settings[setting] = {
      string: string,
      value: option,
      position: position
    };

    if (show) settings[setting].show = show;

    chrome.storage.sync.set({ settings: settings }, function() {
      updateLanguages();
      loadLanguages();
    });
    saveSettings();
  }
}

function saveSettings() {
  chrome.storage.sync.get("settings", function(res) {
    settings = res.settings;
    var settingsSave = settings;
    settingsSave = Object.assign(
      {},
      ...Object.keys(settingsSave).map(k => {
        return { [k]: settings[k].value };
      })
    );
    if (socket.connected) {
      socket.emit("optionUpdate", settingsSave);
      chrome.storage.local.set({ settingsAppUpdated: true });
    } else {
      chrome.storage.local.set({ settingsAppUpdated: false });
    }
  });
}

//TODO Move this to langManager.js
/**
 * Convert language code to the one used by POEditor
 * @param {String} langCode Language code
 */
function convertLangCode(langCode) {
  langCode = langCode.toLocaleLowerCase().replace("_", "-");
  switch (langCode) {
    case "pt-pt":
      langCode = "pt";
      break;
  }

  return langCode;
}
