//* Create socket connection
var socket = io.connect('http://localhost:3020/'),
	tabPriorityInterval;

//* When connected start PreMiD functions
socket.on('connect', function() {
	chrome.storage.local.set({ connected: true });
	PMD_info('Connected to Application');
	chrome.storage.local.get('settingsAppUpdated', (res) => {
		if (res.settingsAppUpdated != undefined && !res.settingsAppUpdated) {
			PMD_info('Sending settings to application...');
			chrome.storage.sync.get('settings', (res) => {
				var newSettings = res.settings;
				Object.keys(res.settings).map((key, index) => {
					newSettings[key] = res.settings[key].value;
				});
				socket.emit('optionUpdate', newSettings);
				chrome.storage.local.remove('settingsAppUpdated');
			});
		}
	});

	tabPriorityInterval = setInterval(tabPriority, 1 * 1000);
});

socket.on('disconnect', function() {
	PMD_error('Disconnected from Application');
	clearInterval(tabPriorityInterval);
	chrome.storage.local.set({ connected: false });
});

socket.on('mediaKeyHandler', function(data) {
	//* Media control buttons
	PMD_info(`Media Control: ${data.playback}`);
	if (priorityTab != null) chrome.tabs.sendMessage(priorityTab, { mediaKeys: data.playback });
});
