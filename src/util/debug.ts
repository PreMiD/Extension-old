import { releaseType } from "../config";

let genericStyle = "font-weight: 800; padding: 2px 5px; color: white;",
	debugging = releaseType !== "RELEASE",
	lastFile: string;

export function info(file: string, message: string, force = false) {
	if (!debugging && !force) return;

	//* Group by file
	groupFile(file);
	console.log(
		"%cPreMiD%cINFO%c " + message,
		genericStyle + "border-radius: 25px 0 0 25px; background: #596cae;",
		genericStyle + "border-radius: 0 25px 25px 0; background: #5050ff;",
		"color: unset;"
	);
}

export function success(file: string, message: string, force = false) {
	if (!debugging && !force) return;

	//* Group by file
	groupFile(file);
	console.log(
		"%cPreMiD%cSUCCESS%c " + message,
		genericStyle + "border-radius: 25px 0 0 25px; background: #596cae;",
		genericStyle +
			"border-radius: 0 25px 25px 0; background: #50ff50; color: black;",
		"color: unset;"
	);
}

export function error(file: string, message: string, force = false) {
	if (!debugging && !force) return;

	//* Group by file
	groupFile(file);
	console.log(
		"%cPreMiD%cERROR%c " + message,
		genericStyle + "border-radius: 25px 0 0 25px; background: #596cae;",
		genericStyle + "border-radius: 0 25px 25px 0; background: #ff5050;",
		"color: unset;"
	);
}

function groupFile(file: string) {
	if (lastFile !== file) {
		console.groupEnd();
		console.group(file);
		lastFile = file;
	}
}
