var extensionData = null,
	iframeData = null;

chrome.runtime.onMessage.addListener(function(data) {
	if (data.tabPriority) {
		var event = new CustomEvent('PreMiD_UpdateData');
		window.dispatchEvent(event);
	}

	if (data.mediaKeys) {
		var event1 = new CustomEvent('PreMiD_MediaKeys', { detail: data.mediaKeys });
		window.dispatchEvent(event1);
	}

	if (!data.tabPriority) {
		sessionStorage.setItem('tabPriority', false);
	}

	if (data.iframeData != undefined) iframeData = data.iframeData;
});

window.addEventListener('PreMiD_RequestExtensionData', async function(data) {
	if (data.detail.strings != undefined) {
		var translations = [];
		for (var i = 0; i < Object.keys(data.detail.strings).length; i++) {
			translations.push(await getString(Object.values(data.detail.strings)[i]));
		}
		Promise.all(translations).then((completed) => {
			for (var i = 0; i < Object.keys(data.detail.strings).length; i++) {
				data.detail.strings[Object.keys(data.detail.strings)[i]] = completed[i];
			}
		});
	}

	if (data.detail.version) data.detail.version = eval(data.detail.version);

	var event = new CustomEvent('PreMiD_ReceiveExtensionData', { detail: data.detail });
	window.dispatchEvent(event);
});

window.addEventListener('PreMiD_UpdatePresence', function(data) {
	chrome.runtime.sendMessage({ presence: data.detail });
});

/**
 * Get variables from the actual site.
 * @param {Array} variables Array of variable names to get
 * @example var variables = getPageVariables(['pageVar']) -> variables.pageVar -> 'Me = Variable'
 */
function getPageVariables(variables) {
	var ret = {};

	var scriptContent = '';
	for (var i = 0; i < variables.length; i++) {
		var currVariable = variables[i];
		scriptContent +=
			'if (typeof ' +
			currVariable +
			" !== 'undefined') document.querySelector('body').setAttribute('tmp_" +
			currVariable +
			"', " +
			currVariable +
			');\n';
	}

	var script = document.createElement('script');
	script.id = 'tmpScript';
	script.appendChild(document.createTextNode(scriptContent));
	(document.body || document.head || document.documentElement).appendChild(script);

	for (var i = 0; i < variables.length; i++) {
		var currVariable = variables[i];
		ret[currVariable] = document.querySelector('body').getAttribute('tmp_' + currVariable);
		document.querySelector('body').removeAttribute('tmp_' + currVariable);
	}

	document.querySelector('#tmpScript').remove();

	return ret;
}

/**
 * Get variables from the page
 * @param {Array} vars Variables to get
 */
async function getPageVariables(vars) {
	return new Promise(function(resolve, reject) {
		window.addEventListener('PreMiD_EvaledPageVariables', (res) => resolve(res.detail), { once: true });
		var event = new CustomEvent('PreMiD_PageVariables', { detail: vars });
		window.dispatchEvent(event);
		setTimeout(reject, 1 * 1000);
	});
}

var script = document.createElement('script');
script.id = 'PreMiD_PageVariables';
script.appendChild(
	document.createTextNode(
		`window.addEventListener('PreMiD_PageVariables', function(e) {
			Promise.all(
				e.detail.map((el) => {
					try {
						return { [el]: eval(el) };
					} catch (e) {
						return { [el]: null };
					}
				})
			).then((vars) => {
				var event = new CustomEvent('PreMiD_EvaledPageVariables', {
					detail: vars.reduce(function(acc, x) {
						for (var key in x) acc[key] = x[key];
						return acc;
					}, {})
				});
				window.dispatchEvent(event);
			});
		});`
	)
);
(document.body || document.head || document.documentElement).appendChild(script);
