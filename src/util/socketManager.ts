import * as socketIo from "socket.io-client";
import { success, error, info } from "./debug";
import { priorityTab } from "./tabPriority";
import presenceDevManager from "./functions/presenceDevManager";
import setActivity from "./functions/setActivity";
import { oldActivity } from "./background/onMessage";
import { getStorage } from "./functions/asyncStorage";

//* Create socket
export let socket = socketIo.connect("http://localhost:3020", {
  autoConnect: false
});

export function connect() {
  socket.open();
}

let appVersion: NodeJS.Timeout = null;

socket.on("connect", async () => {
  //* Tell app to give us its version
  //* Start timeout if we don't receive version response
  socket.emit("getVersion");
  appVersion = setTimeout(() => {
    //* No response got, most likely old version
    chrome.storage.local.set({ appVersionSupported: false });
    error("socketManager.ts", "Unsupported app version");
  }, 5000);

  //TODO move this in a file or so
  let settings = (await getStorage("sync", "settings")).settings;
  settings = Object.assign(
    {},
    ...Object.keys(settings).map(k => {
      return { [k]: settings[k].value };
    })
  );
  socket.emit("settingUpdate", settings);
});

socket.on("receiveVersion", (version: number) => {
  clearTimeout(appVersion);
  if (version >= 203) {
    info("socketManager.ts", "Supported app version");
    chrome.storage.local.set({ appVersionSupported: true });
  } else {
    chrome.storage.local.set({ appVersionSupported: false });
    error("socketManager.ts", "Unsupported app version");
    return;
  }

  if (oldActivity) setActivity(oldActivity);

  success("socketManager.ts", "Connected to application");
  chrome.runtime.sendMessage({ socket: socket.connected });

  if (priorityTab !== null)
    chrome.tabs.sendMessage(priorityTab, { tabPriority: true });
});

socket.on("disconnect", () => {
  error("socketManager.ts", "Disconnected from application");
  chrome.runtime.sendMessage({ socket: socket.connected });

  chrome.storage.local.get("presences", ({ presences }) => {
    presences = (presences as presenceStorage).filter(p => !p.tmp);
    chrome.storage.local.set({ presences: presences });
  });

  if (priorityTab !== null)
    chrome.tabs.sendMessage(priorityTab, { tabPriority: false });
});

//socket.on("mediaKeyHandler", key => console.log(key));

socket.on("localPresence", presenceDevManager);