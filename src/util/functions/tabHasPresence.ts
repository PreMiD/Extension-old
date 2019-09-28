export default async function tabHasPresence(tabId: number) {
  return (await new Promise(resolve => {
    chrome.tabs.executeScript(
      tabId,
      {
        code: "try{PreMiD_Presence}catch(_){false}"
      },
      resolve
    );
  }))[0];
}
