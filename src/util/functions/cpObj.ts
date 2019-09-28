export default function cpObj(mainObj: any) {
  let objCopy: any = {}; // objCopy will store a copy of the mainObj
  let key: any;

  for (key in mainObj) {
    objCopy[key] = mainObj[key]; // copies each property to the objCopy object
  }
  return objCopy;
}
