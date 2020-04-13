import {
	getString as getstring,
	getStrings as getstrings
} from "./util/langManager";
import { getStorage as getstorage } from "./util/functions/asyncStorage";
import Axios from "axios";
import { apiBase as apibase } from "./config";

export let getString = getstring;
export let getStrings = getstrings;
export let getStorage = getstorage;
export let axios = Axios;
export let apiBase = apibase;
