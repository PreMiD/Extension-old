let genericStyle = "font-weight: 800; padding: 2px 5px; color: white;",
  devVersion =true||
    chrome.runtime.getManifest().version_name.includes("-DEV") ||
    chrome.runtime.getManifest().version_name.includes("-BETA");

export function info(message: string) {
  if (devVersion)
    console.log(
      "%cPreMiD%cINFO%c " + message,
      genericStyle + "border-radius: 25px 0 0 25px; background: #596cae;",
      genericStyle + "border-radius: 0 25px 25px 0; background: #5050ff;",
      "color: unset;"
    );
}

export function success(message: string) {
  if (devVersion)
    console.log(
      "%cPreMiD%cSUCCESS%c " + message,
      genericStyle + "border-radius: 25px 0 0 25px; background: #596cae;",
      genericStyle +
        "border-radius: 0 25px 25px 0; background: #50ff50; color: black;",
      "color: unset;"
    );
}

export function error(message: string) {
  if (devVersion)
    console.log(
      "%cPreMiD%cERROR%c " + message,
      genericStyle + "border-radius: 25px 0 0 25px; background: #596cae;",
      genericStyle + "border-radius: 0 25px 25px 0; background: #ff5050;",
      "color: unset;"
    );
}
