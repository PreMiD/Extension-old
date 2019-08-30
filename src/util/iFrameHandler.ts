var waitResponse: any = setInterval(() => {
    chrome.runtime.sendMessage({ iFrame: true });
  }, 1000),
  scriptInjected = false;

chrome.runtime.onMessage.addListener(async msg => {
  if (msg.iFrameUpdateData && scriptInjected) {
    var evt = new CustomEvent("PreMiD_UpdateData");
    document.dispatchEvent(evt);
  }

  if (typeof msg.iFrame !== "undefined" && !scriptInjected) {
    clearInterval(waitResponse);
    waitResponse = null;

    if (window.location.href.match(new RegExp(msg.iFrameRegExp)) !== null) {
      scriptInjected = true;

      var script = document.createElement("script");

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
});

document.addEventListener("PreMiD_iFrameData", data => {
  // @ts-ignore
  chrome.runtime.sendMessage({ iFrameData: data.detail });
});
