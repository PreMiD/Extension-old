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
        noPresences: "",
        notConnected: "",
        notConnectedMessage: ""
      },
      shiftPressed: false,
      settings: {},
      presences: [],
      currentCategory: "all",
      categoriesShown: false,
      categories: {
        all: {
          icon: "globe",
          id: "all",
          title: "All"
        },
        anime: {
          icon: "star",
          id: "anime",
          title: "Anime"
        },
        games: {
          icon: "leaf",
          id: "games",
          title: "Games"
        },
        music: {
          icon: "music",
          id: "music",
          title: "Music"
        },
        socials: {
          icon: "comments",
          id: "socials",
          title: "Socials"
        },
        videos: {
          icon: "play",
          id: "videos",
          title: "Videos & Streams"
        },
        other: {
          icon: "box",
          id: "other",
          title: "Other"
        }
      },
      connected: false,
      managePresences: false
    };
  },
  created: async function() {
    if (localStorage.currentCategory) {
      this.currentCategory = localStorage.currentCategory;
    }

    chrome.runtime.sendMessage({
      popup: true
    });
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
      noPresences: await pmd.getString("popup.presences.noPresences"),
      notConnected: await pmd.getString("popup.info.notConnected"),
      notConnectedMessage: await pmd.getString(
        "popup.info.notConnected.message"
      )
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

        //* Disabled as browsers already support it > won't work
        delete result.settings.mediaKeys;
      });
    });

    this.settings = Object.assign(
      ...Object.keys(this.settings)
        .sort((a, b) => this.settings[a].position - this.settings[b].position)
        .map(s => {
          return {
            [s]: this.settings[s]
          };
        })
    );

    //* Get presences, save in array
    this.presences = await new Promise(function(resolve, reject) {
      chrome.storage.local.get("presences", function(result) {
        //* Sort alphabetically
        resolve(sortPresences(result.presences));
      });
    });

    //* On presence change update
    chrome.storage.onChanged.addListener(key => {
      if (Object.keys(key)[0] === "presences") {
        this.presences = sortPresences(key.presences.newValue);

        if (this.presences.length == 0) this.managePresences = false;
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
  computed: {
    filteredPresences() {
      return this.presences.filter(presence => {
        if (this.currentCategory == "all") return presence;
        if (this.currentCategory !== undefined)
          return presence.metadata.category == this.currentCategory;
      });
    }
  },
  methods: {
    updateSetting(key, { target }) {
      chrome.storage.sync.get("settings", function(result) {
        result.settings[key].value = target.checked;
        chrome.storage.local.set({
          settingsAppUpdated: false
        });

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
        p => p.metadata.service != this.presences[key].metadata.service
      );

      chrome.storage.local.set({
        presences: this.presences
      });
    },
    loadLocalPresence() {
      this.shiftPressed = false;
      chrome.runtime.sendMessage({
        popup: {
          loadLocalPresence: true
        }
      });
    }
  },
  template: `
  <div class="pmd_settings">

    <div v-if="!connected" class="message-container message-container--error">
      <h1 class="message-container__title" v-text="this.notConnected" />
      <p class="message-container__details" v-text="this.notConnectedMessage" />
    </div>

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
      <div class="title-wrapper">
        <h2 class="container__title">{{strings.presences}}</h2>
        <a draggable="false" @click="categoriesShown = !categoriesShown" v-if="filteredPresences.length > 0 && (!shiftPressed || !connected) || managePresences" class="manage-btn">
          <span><i class="fas fa-tag" /></span>
        </a>
        <a draggable="false" class="manage-btn" v-if="filteredPresences.length > 0 && (!shiftPressed || !connected) || managePresences" v-on:click="managePresences = !managePresences">
          <span v-if="!managePresences"><i class="fas fa-cog" /></span>
          <span v-else><i class="fas fa-check-circle" /></span>
        </a>
        <a draggable="false" class="manage-btn" v-if="!managePresences && shiftPressed && connected" v-on:click="loadLocalPresence">
          <p>{{strings.load}}</p>
        </a>
      </div>
      <transition name="scaleIn" mode="out-in">
      <div v-show="categoriesShown" class="presence-categories">
        <a draggable="false" href="#" @click="currentCategory = category.id; localStorage.currentCategory = category.id;" class="presence-categories__label" :class="{ 'presence-categories__label--active': currentCategory == category.id }" v-for="category in categories" :key="category.id"><i :class="'fas fa-' + category.icon" /> {{category.title}}</a>
      </div>
      </transition>
      <transition name="scaleIn" mode="out-in">
        <div v-if="filteredPresences.length > 0">
      <div class="container__setting" v-for="(presence, key) in filteredPresences">
        <img draggable="false" :src="presence.metadata.logo" width="24px">
        <div class="setting__title setting__title--presence">
          <p>
            <span class="tmp" v-if="presence.tmp">tmp</span> {{presence.metadata.service}}
          </p>
        </div>
        <div class="setting__switcher">
          <div class="pmd_checkbox">
            <transition name="scaleIn" mode="out-in">
              <a v-if="managePresences" class="removePresence" v-on:click="removePresence(key)">
                <i class="far fa-trash-alt"></i>
              </a>
              <label v-else>
                <input v-model="filteredPresences[key].enabled" @change="updatePresence(presence.metadata.service, $event)" type="checkbox" :checked="presence.enabled" />
                <span v-bind:style="[filteredPresences[key].enabled ? {'background-color': presence.metadata.color} : {}]" ref="checkbox" class="checkbox-container"></span>
              </label>
            </transition>
          </div>
        </div>
      </div>
    </div>
  </transition>

    <!-- Presence store -->
    <div>
      <a v-if="filteredPresences.length <= 3" href="https://premid.app/store" target="_blank" class="button button--store" v-html="strings.presenceStore"/>
    </div>
  </div>
  </div>`
});

function sortPresences(presences) {
  return presences.sort((a, b) => {
    a = a.metadata.service.toUpperCase();
    b = b.metadata.service.toUpperCase();

    return a < b ? -1 : a > b ? 1 : 0;
  });
}
