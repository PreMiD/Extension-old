//* Settings View
Vue.component("settingsView", {
  data: function() {
    return {
      strings: {
        general: "",
        presences: "",
        manage: "",
        load: "",
        done: "",
        presenceStore: "",
        noPresences: ""
      },
      shiftPressed: false,
      settings: {},
      presences: [],
      connected: false,
      managePresences: false
    };
  },
  created: async function() {
    chrome.runtime.sendMessage({ popup: true });
    chrome.runtime.onMessage.addListener(msg => {
      if (typeof msg.socket !== "undefined") this.connected = msg.socket;
    });

    this.strings = {
      general: await pmd.getString("popup.headings.general"),
      presences: await pmd.getString("popup.headings.presences"),
      manage: await pmd.getString("popup.presences.manage"),
      load: await pmd.getString("popup.presences.load"),
      done: await pmd.getString("popup.presences.done"),
      presenceStore: await pmd.getString("popup.buttons.presenceStore"),
      noPresences: await pmd.getString("popup.presences.noPresences")
    };

    //* Get settings, filter language option for now, save in object
    this.settings = await new Promise(function(resolve, reject) {
      chrome.storage.sync.get("settings", function(result) {
        Promise.all(
          Object.keys(result.settings).map(async (key, index) => {
            if (typeof result.settings[key].show === "undefined") return;

            result.settings[key].string = await pmd.getString(
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
        //* Sort alphabetically
        resolve(
          result.presences.sort((a, b) => {
            return a.metadata.service < b.metadata.service
              ? -1
              : a.metadata.service > b.metadata.service
              ? 1
              : 0;
          })
        );
      });
    });

    //* On presence change update
    chrome.storage.onChanged.addListener(key => {
      if (Object.keys(key)[0] === "presences") {
        this.presences = key.presences.newValue.sort((a, b) => {
          return a.metadata.service < b.metadata.service
            ? -1
            : a.metadata.service > b.metadata.service
            ? 1
            : 0;
        });

        if (this.presences.filter(p => !p.tmp).length == 0)
          this.managePresences = false;
      }
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
        result.presences.find(p => p.metadata.service == key).enabled =
          target.checked;

        chrome.storage.local.set(result);
      });
    },
    removePresence(key) {
      this.presences = this.presences.filter(
        p => p.metadata.service != this.presences[key].metadata.service || p.tmp
      );

      chrome.storage.local.set({ presences: this.presences });
    },
    loadLocalPresence() {
      this.shiftPressed = false;
      chrome.runtime.sendMessage({ popup: { loadLocalPresence: true } });
    }
  },
  template: `
  <div class="pmd_settings">
    <div class="settings__container">
      <h2 class="container__title">{{strings.general}}</h2>
      <div class="container__setting" v-for="(value, key) in settings">
        <div class="setting__title">
          <p v-text="value.string"></p>
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

    <!-- Presence settings -->
    <div class="settings__container">
      <div class="titleWrapper">
        <h2 class="container__title">{{strings.presences}}</h2>
        <a class="manage" v-if="presences.filter(p => !p.tmp).length > 0 && (!shiftPressed || !connected) || managePresences" v-on:click="managePresences = !managePresences">
          <p v-if="!managePresences">{{strings.manage}}</p>
          <p v-else>{{strings.done}}</p>
        </a>
        <a class="manage" v-if="!managePresences && shiftPressed && connected" v-on:click="loadLocalPresence">
          <p>{{strings.load}}</p>
        </a>
      </div>
      <div class="container__setting" v-for="(value, key) in presences">
        <div class="setting__title">
          <p><span class="tmp" v-if="value.tmp">tmp</span> {{value.metadata.service}}</p>
        </div>
        <div class="setting__switcher">
          <div class="pmd_checkbox">
            <transition name="scaleIn" mode="out-in">
              <a v-if="managePresences && !presences[key].tmp" class="removePresence" v-on:click="removePresence(key)">
                <i class="far fa-trash-alt"></i>
              </a>
              <label v-else>
                <input v-model="presences[key].enabled" @change="updatePresence(value.metadata.service, $event)" type="checkbox" :checked="value.enabled" />
                <span v-bind:style="[presences[key].enabled ? {'background-color': value.metadata.color} : {}]" ref="checkbox" class="checkbox-container"></span>
              </label>
            </transition>
          </div>
        </div>
      </div>

      <!-- No Presences/Presence store -->
      <div v-if="presences.length === 0">
        <p class="noPresences" v-html="strings.noPresences"></p>
        <a href="https://premid.app/store" target="_blank" class="presenceStore" v-html="strings.presenceStore"/>
      </div>
    </div>
  </div>`
});
