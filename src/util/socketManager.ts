import * as socketIo from "socket.io-client";
import { success, error, info } from "./debug";
import { priorityTab } from "./tabPriority";
import presenceDevManager from "./functions/presenceDevManager";
import { oldActivity, setActivity } from "../background";

//* Create socket
export let socket = socketIo.connect("http://localhost:3020", {
  autoConnect: false
});

export function connect() {
  socket.open();
}

socket.on("connect", () => {
  socket.emit("getVersion");
  socket.once("receiveVersion", (version: number) => {
    //TODO increase this for 2.0
    if (version >= 202) {
      info("Supported app version");
      chrome.storage.local.set({ appVersionSupported: true });
    } else {
      chrome.storage.local.set({ appVersionSupported: false });
      error("Unsupported app version");
      socket.disconnect();
    }
  });

  if (oldActivity) setActivity(oldActivity);

  success("Connected to application");
  chrome.runtime.sendMessage({ socket: socket.connected });

  if (priorityTab !== null)
    chrome.tabs.sendMessage(priorityTab, { tabPriority: true });
});

socket.on("disconnect", () => {
  error("Disconnected from application");
  chrome.runtime.sendMessage({ socket: socket.connected });

  chrome.storage.local.get("presences", ({ presences }) => {
    presences = presences.filter(p => !p.tmp);
    chrome.storage.local.set({ presences: presences });
  });

  if (priorityTab !== null)
    chrome.tabs.sendMessage(priorityTab, { tabPriority: false });
});

//socket.on("mediaKeyHandler", key => console.log(key));

socket.on("localPresence", presenceDevManager);
