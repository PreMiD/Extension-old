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

  socket.emit("setActivity", pTS);
  info("setActivity");
}
