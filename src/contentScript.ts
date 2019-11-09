import { getString } from "./util/langManager";
import { info } from "./util/debug";
let tabPriority: NodeJS.Timeout = null;

chrome.runtime.onMessage.addListener(function(data) {
  if (typeof data.iFrameData !== "undefined") {
    let event = new CustomEvent("PreMiD_iFrameData", {
      detail: data.iFrameData
    });

    window.dispatchEvent(event);
  }

  if (typeof data.tabPriority !== "undefined") {
    if (data.tabPriority) {
      //* Prevent multiple intervals
      if (tabPriority === null) {
        info("contentScript.ts", `Tab Priority: ${data.tabPriority}`);
        tabPriority = setInterval(() => {
          chrome.runtime.sendMessage({ iFrameUpdateData: true });

          let event = new CustomEvent("PreMiD_UpdateData");
          document.dispatchEvent(event);

          info("contentScript.ts", "updateData");
        }, 100);
      }
    } else {
      clearInterval(tabPriority);
      tabPriority = null;
    }
  }
});

window.addEventListener("PreMiD_UpdatePresence", function(data: CustomEvent) {
  if (typeof data.detail.presenceData.largeImageKey !== "undefined")
    data.detail.presenceData.largeImageText = `${
      chrome.runtime.getManifest().name
    } v${chrome.runtime.getManifest().version_name}`;
  chrome.runtime.sendMessage({ presence: data.detail });
});

window.addEventListener("PreMiD_RequestExtensionData", async function(
  data: CustomEvent
) {
  if (data.detail.strings != undefined) {
    let translations = [];
    for (let i = 0; i < Object.keys(data.detail.strings).length; i++) {
      translations.push(
        await getString(Object.values<string>(data.detail.strings)[i])
      );
    }
    Promise.all(translations).then(completed => {
      for (let i = 0; i < Object.keys(data.detail.strings).length; i++) {
        data.detail.strings[Object.keys(data.detail.strings)[i]] = completed[i];
      }
    });
  }

  if (data.detail.version) data.detail.version = eval(data.detail.version);

  let event = new CustomEvent("PreMiD_ReceiveExtensionData", {
    detail: data.detail
  });
  window.dispatchEvent(event);
});
