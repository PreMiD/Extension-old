setInterval(() => {
	chrome.runtime.sendMessage({ iframe_video: 'Hi there!' });
}, 1000);
