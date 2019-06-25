//* Settings View
Vue.component("settingsView", {
  data: function() {
    return {
      strings: {
        general: "",
        presences: "",
        manage: "",
        cancel: ""
      },
      settings: {},
      presences: [],
      connected: false,
      managePresences: false
    };
  },
  created: async function() {
    this.strings = {
      general: await getString("popup.headings.general"),
      presences: await getString("popup.headings.presences"),
      manage: await getString("popup.presences.manage"),
      cancel: await getString("popup.presences.cancel")
    };

    setInterval(async () => {
      var self = this;
      self.connected = (await new Promise(function(resolve, reject) {
        chrome.storage.local.get("connected", resolve);
      })).connected;
    }, 100);

    //* Get settings, filter language option for now, save in object
    this.settings = await new Promise(function(resolve, reject) {
      chrome.storage.sync.get("settings", function(result) {
        Promise.all(
          Object.keys(result.settings).map(async (key, index) => {
            if (result.settings[key].show != undefined) return;
            result.settings[key].string = await getString(
              result.settings[key].string
            );
          })
        ).then(res => {
          chrome.runtime.getPlatformInfo(function(info) {
            if (!info.os == "mac") delete result.settings.titleMenubar;
            delete result.settings.language;
            resolve(result.settings);
          });
        });
      });
    });

    this.settings = Object.assign(
      ...Object.keys(this.settings)
        .sort((a, b) => this.settings[a].position - this.settings[b].position)
        .map(s => {
          return { [s]: this.settings[s] };
        })
    );

    //* Get presences, save in array
    this.presences = await new Promise(function(resolve, reject) {
      chrome.storage.local.get("presences", function(result) {
        resolve(result.presences);
      });
    });
  },
  methods: {
    updateSetting(key, { target }) {
      chrome.storage.sync.get("settings", function(result) {
        result.settings[key].value = target.checked;
        chrome.storage.local.set({ settingsAppUpdated: false });

        chrome.storage.sync.set(result);
      });
    },
    updatePresence(key, { target }) {
      chrome.storage.local.get("presences", function(result) {
        result.presences.find(p => p.service == key).enabled = target.checked;

        chrome.storage.local.set(result);
      });
    },
    removePresence(key) {
      this.presences = this.presences.filter(
        p => p.service != this.presences[key].service
      );

      chrome.storage.local.set({ presences: this.presences });
    }
  },
  template: /* html */ `

<div class="pmd_settings">
	<div class="settings__container">
		<h2 class="container__title">{{strings.general}}</h2>
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
      <div class="titleWrapper">
        <h2 class="container__title">{{strings.presences}}</h2>
        <a class="manage" v-if="presences.filter(p => !p.tmp).length > 0" v-on:click="managePresences = !managePresences">
          <p v-if="!managePresences">{{strings.manage}}</p>
          <p v-else>{{strings.cancel}}</p>
        </a>
      </div>
			<div class="container__setting" v-for="(value, key) in presences">
				<div class="setting__title">
          <a v-if="managePresences && !presences[key].tmp" class="removePresence" v-on:click="removePresence(key)">
            <i class="fas fa-times"></i>
          </a>
					<p><span class="tmp" v-if="value.tmp">tmp</span> {{value.service}}</p>
				</div>
				<div class="setting__switcher">
        <div class="pmd_checkbox">
          <label>
            <input v-model="presences[key].enabled" @change="updatePresence(value.service, $event)" type="checkbox" :checked="value.enabled" />

            <span v-bind:style="[presences[key].enabled ? {'background-color': value.color} : {}]" ref="checkbox" class="checkbox-container"></span>
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
