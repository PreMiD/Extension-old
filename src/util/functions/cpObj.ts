export default function cpObj(mainObj: any) {
	//* objCopy will store a copy of the mainObj
	let objCopy: any = {},
		key: any;

	for (key in mainObj) {
		//* copies each property to the objCopy object
		objCopy[key] = mainObj[key];
	}
	return objCopy;
}
