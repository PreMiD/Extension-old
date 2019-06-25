chrome.runtime.onMessage.addListener(function(data) {
  if (data.tabPriority) {
    var event = new CustomEvent("PreMiD_UpdateData");
    window.dispatchEvent(event);
  }

  if (data.mediaKeys) {
    var event1 = new CustomEvent("PreMiD_MediaKeys", {
      detail: data.mediaKeys
    });
    window.dispatchEvent(event1);
  }

  if (!data.tabPriority) {
    sessionStorage.setItem("tabPriority", false);
  }

  if (typeof data.iFrameData !== "undefined") {
    var event2 = new CustomEvent("PreMiD_iFrameData", {
      detail: data.iFrameData
    });
    window.dispatchEvent(event2);
  }
});

window.addEventListener("PreMiD_RequestExtensionData", async function(data) {
  if (data.detail.strings != undefined) {
    var translations = [];
    for (var i = 0; i < Object.keys(data.detail.strings).length; i++) {
      translations.push(await getString(Object.values(data.detail.strings)[i]));
    }
    Promise.all(translations).then(completed => {
      for (var i = 0; i < Object.keys(data.detail.strings).length; i++) {
        data.detail.strings[Object.keys(data.detail.strings)[i]] = completed[i];
      }
    });
  }

  if (data.detail.version) data.detail.version = eval(data.detail.version);

  var event = new CustomEvent("PreMiD_ReceiveExtensionData", {
    detail: data.detail
  });
  window.dispatchEvent(event);
});

window.addEventListener("PreMiD_UpdatePresence", function(data) {
  chrome.runtime.sendMessage({ presence: data.detail });
});
