async function fetchJSON(url) {
	return new Promise(async function(resolve, reject) {
		resolve(
			await fetch(encodeURI(url))
				.then((res) => {
					return res.json();
				})
				.catch(reject)
				.then((json) => {
					return json;
				})
		);
	});
}
