//* Settings View
Vue.component('settingsView', {
	data: function() {
		return {
			strings: {
				general: '',
				presences: ''
			},
			settings: {},
			presences: []
		};
	},
	created: async function() {
		this.strings = {
			general: await getString('popup.headings.general'),
			presences: await getString('popup.headings.presences')
		};

		//* Get settings, filter language option for now, save in object
		this.settings = await new Promise(function(resolve, reject) {
			chrome.storage.sync.get('settings', function(result) {
				Promise.all(
					Object.keys(result.settings).map(async (key, index) => {
						if (result.settings[key].show != undefined) return;
						result.settings[key].string = await getString(result.settings[key].string);
					})
				).then((res) => {
					delete result.settings.language;
					resolve(result.settings);
				});
			});
		});

		//* Get presences, save in array
		this.presences = await new Promise(function(resolve, reject) {
			chrome.storage.local.get('presences', function(result) {
				Promise.all(
					result.presences.map((p) => {
						p.color = `background-color: ${p.color}`;
						return p;
					})
				).then((c) => resolve(c));
			});
		});
	},
	template: /*html*/ `
  <div id="settingsView">
    <div id="general" class="panel">
      <h1>{{this.strings.general}}</h1>
      <div v-for="(value, key) in settings">
				<h3>{{value.string}}</h3>
				<div class="switch">
					<label>
						<input type="checkbox" checked="value.value">
						<span class="lever"></span>
					</label>
				</div>
      </div>
    </div>

    <div id="presences" class="panel">
      <h1>{{this.strings.presences}}</h1>
      <div v-for="(value, name) in presences">
				<h3>{{value.service}}</h3>
				<div class="switch">
					<label>
						<input type="checkbox" checked="value.enabled">
						<span class="lever" :style="value.color"></span>
					</label>
				</div>
      </div>
    </div>
	</div>`
});
