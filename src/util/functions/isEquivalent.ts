//* Credit http://adripofjavascript.com/blog/drips/object-equality-in-javascript.html
export default function isEquivalent(a: any, b: any) {
	//* Create arrays of property names
	let aProps = Object.getOwnPropertyNames(a),
		bProps = Object.getOwnPropertyNames(b);

	//* If number of properties is different,
	//* objects are not equivalent
	if (aProps.length != bProps.length) {
		return false;
	}

	for (let i = 0; i < aProps.length; i++) {
		let propName = aProps[i];

		//* If values of same property are not equal,
		//* objects are not equivalent
		if (a[propName] !== b[propName]) {
			return false;
		}
	}

	//* If we made it this far, objects
	//* are considered equivalent
	return true;
}
