//* Extension installed/updated
chrome.runtime.onInstalled.addListener(function(details) {
	switch (details.reason) {
		case 'update':
			//* Load last saved version string
			chrome.storage.local.get([ 'lastVersion' ], function(result) {
				//* Check if it is a new version or not
				if (result.lastVersion != details.previousVersion) {
					//* Save new version to prevent errors
					chrome.storage.local.set({ lastVersion: details.previousVersion });
					//TODO Open updated tab & settings init
				}
			});
			break;
		case 'install':
			//* Create Options
			//TODO Open installed tab & settings init
			break;
	}
});

var priorityTab,
	lastTab,
	tabPriorityLock = 0;
function tabPriority() {
	//* Get all active tabs
	chrome.tabs.query({ active: true }, function(tabs) {
		//* Load all presences
		chrome.storage.local.get([ 'presences' ], function(result) {
			//* Keep only enabled ones
			var presences = result.presences.filter((f) => f.enabled);
			//TODO clear array if PreMiD == disabled
			//* If there are any proceed
			if (presences.length > 0) {
				//* If priorityTab == current tab reset priorityLock
				if (priorityTab != tabs[0].id) {
					//* If tab change reset tabPriorityLock
					if (lastTab != tabs[0].id) {
						tabPriorityLock = 0;
						lastTab = tabs[0].id;
					}

					//* Loop through presences
					for (var i = 0; presences.length > i; i++) {
						//* active tab url contains presence url
						if (tabs[0].url.indexOf(presences[i].url) > -1) {
							//* Update priorityTab when 5 seconds passed else increase count
							if (tabPriorityLock >= 4) {
								//* Send tab message to stop its intervals
								chrome.tabs.sendMessage(priorityTab, { tabPriority: false });

								priorityTab = tabs[0].id;
							} else tabPriorityLock++;
						}
					}
				} else tabPriorityLock = 0;
			}
		});
	});

	if (priorityTab) {
		//* Tell tab to enable intervals
		chrome.tabs.sendMessage(priorityTab, { tabPriority: true });
	}
}
