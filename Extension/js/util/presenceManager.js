window.addEventListener('PreMiD_AddPresence', function(data) {
	addPresence(data.detail);
});

window.addEventListener('PreMiD_RemovePresence', function(data) {
	removePresence(data.detail);
});

chrome.storage.local.get('presences', (result) => {
	var event = new CustomEvent('PreMiD_ListPresences', { detail: result.presences.map((p) => p.service) });
	window.dispatchEvent(event);
});

function addPresence(name) {
	chrome.storage.local.get('presences', async function(presences) {
		presences = presences.presences;

		if (presences.find((p) => p.service == name) != undefined) {
			PMD_error('Presence already added');
			return;
		}

		var json = await fetchJSON(`https://api.premid.app/presences/${name}`);

		if (json.error) {
			PMD_error(`Presence ${name} not found.`);
			return;
		}

		var presenceMeta = await fetchJSON(json.url + 'metadata.json');

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
	});
}

function removePresence(name) {
	chrome.storage.local.get('presences', async function(presences) {
		presences = presences.presences;

		var presenceToRemove = presences.find((p) => p.service == name);

		if (presenceToRemove == undefined) {
			PMD_error('Presence not found');
			return;
		}

		chrome.storage.local.set({ presences: presences.filter((p) => p.service != name) });
	});
}
