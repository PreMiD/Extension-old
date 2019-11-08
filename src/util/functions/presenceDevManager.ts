import { info, error } from "../debug";
import { getStorage } from "./asyncStorage";
import { priorityTab } from "../tabPriority";

//TODO Finish and show in some way
let errors = [];
export default async function(files: any) {
  errors = [];
  info("presenceDevManager.ts", "Local Presence update");

  files = files.files;
  let metadata = files.find(f => f.file.toLowerCase() === "metadata.json"),
    presence = files.find(f => f.file.toLowerCase() === "presence.js"),
    iframe = files.find(f => f.file.toLowerCase() === "iframe.js");

  if (!metadata) errors.push("No metadata.json found.");
  else {
    metadata = metadata.contents;

    if (typeof metadata.iframe !== "undefined" && metadata.iframe && !iframe)
      errors.push("No iframe.js found.");

    if (typeof metadata.service === "undefined")
      errors.push("property service not defined.");

    if (typeof metadata.author !== "object")
      errors.push("property author not defined.");
    else {
      if (typeof metadata.author.name === "undefined")
        errors.push("property author.name not defined.");

      if (typeof metadata.author.id === "undefined")
        errors.push("property author.id not defined.");
    }

    if (typeof metadata.description !== "object")
      errors.push("property description not defined.");
    else {
      if (typeof metadata.description.en === "undefined")
        errors.push("property description.en not defined.");
    }

    if (typeof metadata.url === "undefined")
      errors.push("property url not defined.");
  }
  if (!presence) errors.push("No presence.js found.");

  errors.map(err => error("presenceDevManager.ts", err));

  let { presences } = await getStorage("local", "presences");

  presences = presences.filter(p => !p.tmp);

  let addedPresence = presences.find(
    p => p.metadata.service === metadata.service
  );
  if (addedPresence) addedPresence.enabled = false;

  let tmpPr = {
    enabled: true,
    metadata: metadata,
    presence: presence.contents,
    tmp: true
  };

  if (typeof metadata.iframe !== "undefined" && metadata.iframe)
    // @ts-ignore
    tmpPr.iframe = iframe.contents;

  presences.push(tmpPr);

  chrome.storage.local.set({ presences: presences });

  chrome.tabs.reload(priorityTab);
}
