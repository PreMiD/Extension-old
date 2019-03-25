setInterval(() => {
	chrome.runtime.sendMessage({ iframeData: 'Hi there!' });
}, 1000);
