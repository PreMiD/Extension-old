import { getStorage } from "./asyncStorage";
import { info } from "../debug";
import { socket } from "../socketManager";
import { oldActivity, setActivity } from "../../background";
import { clearActivity, priorityTab } from "../tabPriority";

let settings = null;

export default async function() {
  settings = (await getStorage("sync", "settings")).settings;
  if (typeof settings === "undefined") settings = {};

  initSetting("enabled", "popup.setting.enabled", 0);
  initSetting("autoLaunch", "popup.setting.autoLaunch", 1);
  initSetting("mediaKeys", "popup.setting.mediaControl", 2);
  initSetting("titleMenubar", "popup.setting.titleMenubar", 3);

  chrome.storage.sync.set({ settings: settings });
}

chrome.storage.onChanged.addListener(changes => {
  if (changes.settings) {
    let nSettings = Object.assign(
      {},
      ...Object.keys(changes.settings.newValue).map(k => {
        return { [k]: changes.settings.newValue[k].value };
      })
    );

    if (nSettings.enabled) setActivity(oldActivity, changes.settings.newValue);
    else if (priorityTab !== null) clearActivity(true);

    if (socket.connected) socket.emit("settingUpdate", nSettings);
    info("Settings update");
  }
});

function initSetting(
  setting: string,
  string: string,
  position: number,
  option: any = true,
  show = true
) {
  if (typeof settings[setting] === "undefined")
    cOption(setting, string, position, option, show);
}

function cOption(
  setting: string,
  string: string,
  position: number,
  option: boolean,
  show: boolean
) {
  if (!settings[setting]) {
    info(`Setting option ${setting}`);
    settings[setting] = {
      string: string,
      value: option,
      position: position
    };

    if (show) settings[setting].show = show;
  }
}
