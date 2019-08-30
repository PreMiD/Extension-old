export function getStorage(
  type: "local" | "sync",
  name: string | Array<string>
) {
  return new Promise<any>(resolve => {
    chrome.storage[type].get(name, items => {
      resolve(items);
    });
  });
}
