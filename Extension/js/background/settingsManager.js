var settings = null;

function updateSetting(setting, value) {
	chrome.storage.sync.get('settings', function(result) {
		settings = result.settings;
	});
}
//* Retrieve options if set
chrome.storage.sync.get('settings', function(result) {
	settings = result.settings;

	if (!settings) {
		PMD_info('Creating default settings...');
		settings = {
			enabled: {
				string: 'popup.settings.enabled',
				value: true
			},
			autoUpdate: {
				string: 'popup.settings.autoUpdate',
				value: true
			},
			autoLaunch: {
				string: 'popup.settings.autoLaunch',
				value: true
			},
			mediaKeys: {
				string: 'popup.settings.mediaKeys',
				value: true
			},
			titleMenubar: {
				string: 'popup.settings.titleMenubar',
				value: true
			},
			language: {
				string: 'popup.settings.language',
				value: chrome.i18n.getUILanguage(),
				show: false
			}
		};

		chrome.storage.sync.set({ settings: settings }, function() {
			updateLanguages();
			loadLanguages();
		});

		saveSettings();
		return;
	}

	initSetting('enabled', 'popup.settings.enabled');
	initSetting('autoUpdate', 'popup.settings.autoUpdate');
	initSetting('autoLaunch', 'popup.settings.autoLaunch');
	initSetting('mediaKeys', 'popup.settings.mediaKeys');
	initSetting('titleMenubar', 'popup.settings.titleMenubar');
	initSetting('language', chrome.i18n.getUILanguage(), 'popup.settings.language', false);
});

function initSetting(setting, string, option = true, show = true) {
	if (!settings) {
		chrome.storage.sync.get('settings', function(result) {
			settings = result.settings;

			if (settings && !settings[setting]) cOption(setting, string, option, show);
		});
	} else if (settings && !settings[setting]) cOption(setting, string, option, show);
}

function cOption(setting, string, option, show) {
	if (!settings[setting]) {
		PMD_info(`Creating option for ${setting}`);
		settings[setting] = {
			string: string,
			value: option
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
	if (socket.connected) socket.emit('optionUpdate', settings);
	else {
		chrome.storage.local.set({ settingsAppUpdated: false });
	}
}
