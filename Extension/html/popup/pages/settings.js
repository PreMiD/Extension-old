//* Settings View
Vue.component("settingsView", {
  data: function() {
    return {
      strings: {
        general: "",
        presences: "",
        manage: "",
        load: "",
        cancel: "",
        presenceStore: ""
      },
      shiftPressed: false,
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
      load: await getString("popup.presences.load"),
      cancel: await getString("popup.presences.cancel"),
      presenceStore: await getString("popup.buttons.presenceStore")
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

    //* Presence dev stuff
    window.addEventListener("keydown", e => {
      this.shiftPressed = event.shiftKey;
    });

    window.addEventListener("keyup", e => {
      this.shiftPressed = event.shiftKey;
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
        p => p.service != this.presences[key].service || p.tmp
      );

      chrome.storage.local.set({ presences: this.presences });
    },
    loadLocalPresence() {
      chrome.runtime.sendMessage({ loadPresence: true });
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
        <a class="manage" v-if="presences.filter(p => !p.tmp).length > 0 && !shiftPressed" v-on:click="managePresences = !managePresences">
          <p v-if="!managePresences">{{strings.manage}}</p>
          <p v-else>{{strings.cancel}}</p>
        </a>
        <a class="manage" v-if="shiftPressed" v-on:click="loadLocalPresence">
          <p>{{strings.load}}</p>
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
    <a href="https://premid.app/store" target="_blank" class="presenceStore" v-if="presences.length === 0" v-html="strings.presenceStore"/>
  </div>
</div>`
});
