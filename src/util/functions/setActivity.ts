import { socket } from "../socketManager";
import { info } from "../debug";
import cpObj from "./cpObj";
import { getStorage } from "./asyncStorage";

export default async function setActivity(presence: any, settings = undefined) {
  if (!settings) settings = (await getStorage("sync", "settings")).settings;
  let pTS = cpObj(presence);
  if (presence == null || !settings.enabled.value) return;

  if (settings.titleMenubar.value) {
    if (typeof pTS.trayTitle !== "undefined")
      pTS.trayTitle = pTS.trayTitle.trim();
  } else pTS.trayTitle = "";

  if (!settings.mediaKeys.value) pTS.mediaKeys = false;

  if (typeof pTS.presenceData.details !== "undefined")
    pTS.presenceData.details.slice(0, 128);
  if (typeof pTS.presenceData.state !== "undefined")
    pTS.presenceData.state.slice(0, 128);

  socket.emit("setActivity", pTS);
  info("setActivity.ts", "setActivity");
}
