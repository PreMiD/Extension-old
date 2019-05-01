//* Settings View
Vue.component('settingsView', {
	data: function() {
		return {
			strings: {
				general: '',
				presences: ''
			},
			settings: {},
			presences: [],
			thing: {}
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
				resolve(result.presences);
			});
		});
	},
	methods: {
		updateSetting(key, value) {
			chrome.storage.sync.get('settings', function(result) {
				result.settings[key].value = value;

				chrome.storage.sync.set(result);
			});
		},
		updatePresence(key, value) {
			chrome.storage.local.get('presences', function(result) {
				result.presences.find((p) => p.service == key).enabled = value;

				chrome.storage.local.set(result);
			});
		}
	},
	template: /*html*/ `
  <div id="settingsView">
		<v-container grid-list-md class="panel">
			<h3>{{strings.general}}</h3>
			<v-layout row wrap v-for="(value, key) in settings">
				<v-flex xs17>
					<h6>{{value.string}}</h6>
				</v-flex>
				<v-flex xs3>
					<v-switch :input-value="value.value" color="#7289da" @change="updateSetting(key, $event)"></v-switch>
				</v-flex>
			</v-layout>
		</v-container>

		<v-container grid-list-md class="panel">
			<h3>{{strings.presences}}</h3>
			<v-layout row wrap v-for="(value, key) in presences">
				<v-flex xs17>
					<h6>{{value.service}} <p v-if="value.tmp">tmp</p></h6>
				</v-flex>
				<v-flex xs3>
					<v-switch :input-value="value.enabled" :color="value.color" @change="updatePresence(value.service, $event)"></v-switch>
				</v-flex>
			</v-layout>
		</v-container>
	</div>`
});
