let waitResponse: any = setInterval(() => {
		//TODO Find a way to prevent console error spam (context invalidated) > Most likely using runtime.connect()
		chrome.runtime.sendMessage({
			iFrame: true
		});
	}, 1000),
	scriptInjected = false;

chrome.runtime.onMessage.addListener(async msg => {
	if (typeof msg.iFrame !== "undefined" && !scriptInjected) {
		clearInterval(waitResponse);
		waitResponse = null;
		//* If no iFrame, return
		if (!msg.iFrame) return;

		if (window.location.href.match(new RegExp(msg.iFrameRegExp)) !== null) {
			scriptInjected = true;

			const script = document.createElement("script");

			script.textContent = String(
				(await Promise.resolve(
					fetch(chrome.runtime.getURL("js/devHelper.js")).then(res =>
						res.text()
					)
				)) + msg.iFrame
			);
			document.querySelector("html").appendChild(script);
		}
	}

	if (msg.iFrameUpdateData && scriptInjected) {
		const evt = new CustomEvent("PreMiD_UpdateData");
		document.dispatchEvent(evt);
	}
});

document.addEventListener("PreMiD_iFrameData", (data: CustomEvent) => {
	chrome.runtime.sendMessage({ iFrameData: data.detail });
});
