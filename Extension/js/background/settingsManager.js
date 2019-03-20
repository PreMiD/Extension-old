//* Retrieve options if set
chrome.storage.sync.get([ 'settings' ], function(result) {
	if (!result.settings) {
		console.log('Nice');
	}
});
