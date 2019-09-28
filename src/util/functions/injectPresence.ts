import { success } from "../debug";

export default async function injectPresence(
  tabId: number,
  presence: presenceStorage[0]
) {
  return new Promise(resolve => {
    chrome.tabs.executeScript(
      tabId,
      {
        code: "let PreMiD_Presence=true;" + presence.presence,
        runAt: "document_start"
      },
      resolve
    );

    success(`Injected ${presence.metadata.service}`);
  });
}
