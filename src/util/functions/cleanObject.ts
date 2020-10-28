export default function cleanObject(obj: object): void {
  for (let propName in obj) {
    if (typeof obj[propName] == "object") {
      cleanObject(obj[propName]);
    }
    if (obj[propName] === null || obj[propName] === undefined) {
      delete obj[propName];
    }
  }
}