//* Create socket connection
var socket = io.connect('http://localhost:3020/'),
	tabPriorityInterval;

//* When connected start PreMiD functions
socket.on('connect', function() {
	PMD_info('Connected to Application');
	chrome.storage.local.get('settingsAppUpdated', (res) => {
		if (res.settingsAppUpdated != undefined && !res.settingsAppUpdated) {
			PMD_info('Sending settings to application...');
			chrome.storage.sync.get('settings', (res) => {
				socket.emit('optionUpdate', res.settings);
				chrome.storage.local.remove('settingsAppUpdated');
			});
		}
	});

	tabPriorityInterval = setInterval(tabPriority, 1 * 1000);
});

socket.on('disconnect', function() {
	PMD_error('Disconnected from Application');
	clearInterval(tabPriorityInterval);
});

socket.on('mediaKeyHandler', function(data) {
	//* Media control buttons
	PMD_info(`Media Control: ${data.playback}`);
	if (priorityTab != null) chrome.tabs.sendMessage(priorityTab, { mediaKeys: data.playback });
});
