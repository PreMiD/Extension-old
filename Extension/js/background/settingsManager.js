var settings = null;
//* Retrieve options if set
chrome.storage.sync.get('settings', function(result) {
	settings = result.settings;

	if (!settings) {
		PMD_info('Creating default settings...');
		settings = {
			enabled: true,
			autoUpdate: true,
			autoLaunch: true,
			mediaKeys: true,
			titleMenubar: true,
			language: chrome.i18n.getUILanguage()
		};

		chrome.storage.sync.set({ settings: settings });

		saveSettings();
		return;
	}

	initSetting('enabled');
	initSetting('autoUpdate');
	initSetting('autoLaunch');
	initSetting('mediaKeys');
	initSetting('titleMenubar');
	initSetting('language', chrome.i18n.getUILanguage());
});

function initSetting(setting, option = true) {
	if (!settings) {
		chrome.storage.sync.get('settings', function(result) {
			settings = result.settings;

			if (settings && !settings[setting]) cOption(setting, option);
		});
	} else if (settings && !settings[setting]) cOption(setting, option);
}

function cOption(setting, option) {
	if (!settings[setting]) {
		PMD_info(`Creating option for ${setting}`);
		settings[setting] = option;
		chrome.storage.sync.set({ settings: settings });
		saveSettings();
	}
}

function saveSettings() {
	if (socket.connected) socket.emit('optionUpdate', settings);
	else {
		chrome.storage.local.set({ settingsAppUpdated: false });
	}
}
