import Axios from "axios";

import { apiBase as apibase } from "./config";
import { getStorage as getstorage } from "./util/functions/asyncStorage";
import { getString as getstring, getStrings as getstrings } from "./util/langManager";

export const getString = getstring;
export const getStrings = getstrings;
export const getStorage = getstorage;
export const axios = Axios;
export const apiBase = apibase;
