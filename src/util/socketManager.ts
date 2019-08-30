import * as socketIo from "socket.io-client";
import { success, error } from "./debug";
import { priorityTab, oldPresence } from "./tabPriority";
import presenceDevManager from "./functions/presenceDevManager";

//* Create socket
export var socket = socketIo.connect("http://localhost:3020", {
  autoConnect: false
});

export function connect() {
  socket.open();
}

socket.on("connect", () => {
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

socket.on("mediaKeyHandler", key => console.log(key));

socket.on("localPresence", presenceDevManager);
