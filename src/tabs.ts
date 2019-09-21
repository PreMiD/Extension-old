import { getString as getstring } from "./util/langManager";
import { getStorage as getstorage } from "./util/functions/asyncStorage";
import fetchjson from "./util/functions/fetchJSON";

export let getString = getstring;
export let getStorage = getstorage;
export let fetchJSON = fetchjson;
