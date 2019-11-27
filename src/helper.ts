import {
  getString as getstring,
  getStrings as getstrings
} from "./util/langManager";
import { getStorage as getstorage } from "./util/functions/asyncStorage";
import fetchjson from "./util/functions/fetchJSON";

export let getString = getstring;
export let getStrings = getstrings;
export let getStorage = getstorage;
export let fetchJSON = fetchjson;
