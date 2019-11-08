export default async function tabHasPresence(tabId: number) {
  const res = await new Promise(resolve => {
    chrome.tabs.executeScript(
      tabId,
      {
        code: "try{PreMiD_Presence}catch(_){false}"
      },
      resolve
    );
  });

  if (!res) return "";
  else return res[0];
}
