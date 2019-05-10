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
		updateSetting(key, { target }) {
			chrome.storage.sync.get('settings', function(result) {
				console.log(result.settings[key].value, target.checked, key);
				result.settings[key].value = target.checked;

				chrome.storage.sync.set(result);
			});
		},
		updatePresence(key, { target }) {
			chrome.storage.local.get('presences', function(result) {
				result.presences.find((p) => p.service == key).enabled = target.checked;

				chrome.storage.local.set(result);
			});
		}
	},
	template: /* html */ `

	<div class="pmd_settings">
		<div class="settings__container">
			<h2 class="container__title">Test title</h2>
			<div class="container__setting" v-for="(value, key) in settings">
				<div class="setting__title">
					<p>{{value.string}}</p>
				</div>
				<div class="setting__switcher">
				<div class="pmd_checkbox">
					<label>
					<input @change="updateSetting(key, $event)" type="checkbox" :checked="value.value" />
					<span class="checkbox-container"></span>
					</label>
				</div>
				</div>
			</div>
		</div>
		<div class="settings__container">
			<h2 class="container__title">Test title</h2>
			<div class="container__setting" v-for="(value, key) in presences">
				<div class="setting__title">
					<p>{{value.service}} <span class="badge badge-red" v-if="value.tmp">tmp</span></p>
				</div>
				<div class="setting__switcher">
				<div class="pmd_checkbox">
					<label>
					<input v-model="presences[key].enabled" ref="switch" @change="updatePresence(value.service, $event)" type="checkbox" :checked="value.enabled == true" />
					<span v-bind:style="[presences[key].enabled == true ? {'background-color': value.color} : {}]" ref="checkbox" class="checkbox-container"></span>
					</label>
				</div>
				</div>
			</div>
		</div>
	</div>

  <!-- <div class="settingsView">
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
	</div> -->`
});
