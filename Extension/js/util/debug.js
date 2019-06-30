function PMD_info(message) {
	console.log(
		'%cPreMiD%c ' + message,
		'color: #fff; font-weight: 900; padding: 3px 7px; margin: 3px; background: #596cae; border-radius: 50px;',
		'color: #596cae;'
	);
}

function PMD_error(message) {
	console.log(
		'%cPreMiD%c ' + message,
		'color: #fff; font-weight: 900; padding: 3px; margin: 3px; background: #596cae; border-radius: 5px;',
		'color: #ff0000;'
	);
}

function PMD_success(message) {
	console.log(
		'%cPreMiD%c ' + message,
		'color: #fff; font-weight: 900; padding: 3px; margin: 3px; background: #596cae; border-radius: 5px;',
		'color: #00ff00;'
	);
}
