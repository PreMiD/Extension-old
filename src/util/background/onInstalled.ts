import checkAccess from "../functions/checkAccess";
import { connect } from "../socketManager";
import { getStorage } from "../functions/asyncStorage";
import { start } from "./generic";

var bgPageStarted = false;
chrome.runtime.onInstalled.addListener(async details => {
  //* ExtEnable
  //* Check access (beta)
  clearTimeout(onExtEnable);

  bgPageStarted = true;
  await start();

  await checkAccess().catch(() => chrome.management.uninstallSelf());

  switch (details.reason) {
    case "install":
      install();
      break;
    case "update":
      update();
      break;
  }
});

function install() {
  //* Open installed tab
  //* Set lastVersion
  chrome.tabs.create({
    active: true,
    index: 0,
    url: chrome.runtime.getURL("html/tabs/index.html#/installed")
  });
  chrome.storage.local.set({
    lastVersion: chrome.runtime.getManifest().version_name
  });
}

async function update() {
  //* Check extension update
  //* Updated
  //* Save update version
  //* Open updated tab
  if (
    //@ts-ignore
    parseInt(
      (await getStorage("local", "lastVersion")).lastVersion
        .replace(/\./g, "")
        .slice(0, 3)
    ) <
    parseInt(
      chrome.runtime
        .getManifest()
        .version_name.replace(/\./g, "")
        .slice(0, 3)
    )
  ) {
    chrome.storage.local.set({
      lastVersion: chrome.runtime.getManifest().version_name
    });
    chrome.tabs.create({
      active: true,
      index: 0,
      url: chrome.runtime.getURL("html/tabs/index.html#/updated")
    });
  }
}

//TODO find something better
//* Run this when extension enables (only if was disabled)
let onExtEnable = setTimeout(enable, 100);
async function enable() {
  bgPageStarted = true;
  await start();

  checkAccess()
    .then(connect)
    .catch(() => chrome.management.uninstallSelf());
}
