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
        notConnectedMessage: "",
        outdatedApp: "",
        outdatedAppMessage: "",
        categories: {
          all: "",
          anime: "",
          music: "",
          socials: "",
          videos: "",
          other: ""
        }
      },
      shiftPressed: false,
      settings: {},
      presences: [],
      currentCategory: "all",
      categoriesShown: false,
      supportedVersion: true,
      categories: {
        all: {
          icon: "globe",
          id: "all",
          title: ""
        },
        anime: {
          icon: "star",
          id: "anime",
          title: ""
        },
        games: {
          icon: "leaf",
          id: "games",
          title: ""
        },
        music: {
          icon: "music",
          id: "music",
          title: ""
        },
        socials: {
          icon: "comments",
          id: "socials",
          title: ""
        },
        videos: {
          icon: "play",
          id: "videos",
          title: ""
        },
        other: {
          icon: "box",
          id: "other",
          title: ""
        }
      },
      connected: false,
      managePresences: false
    };
  },
  mounted() {
    const pCats = document.querySelector(".presence-categories");
    let mDown = false;
    let startX;
    let scrollLeft;

    pCats.addEventListener("mousedown", e => {
      e.preventDefault();
      mDown = true;
      startX = e.pageX - pCats.offsetLeft;
      scrollLeft = pCats.scrollLeft;
    });
    pCats.addEventListener("mouseleave", () => (mDown = false));
    pCats.addEventListener("mouseup", () => (mDown = false));
    pCats.addEventListener("mousemove", e => {
      if (!mDown) return;
      const x = e.pageX - pCats.offsetLeft;
      const walkSpeed = (x - startX) * 3;
      pCats.scrollLeft = scrollLeft - walkSpeed;
    });
  },
  created: async function() {
    if (localStorage.currentCategory) {
      this.currentCategory = localStorage.currentCategory;
    }

    chrome.storage.local.get(
      "appVersionSupported",
      ({ appVersionSupported }) => {
        this.supportedVersion = appVersionSupported;
      }
    );

    chrome.runtime.sendMessage({
      popup: true
    });
    chrome.runtime.onMessage.addListener(msg => {
      if (typeof msg.socket !== "undefined") this.connected = msg.socket;
    });

    //TODO recode this to use html tags
    const self = this;
    Promise.all([
      pmd.getString("popup.headings.general"),
      pmd.getString("popup.headings.presences"),
      pmd.getString("popup.presences.manage"),
      pmd.getString("popup.presences.load"),
      pmd.getString("popup.presences.done"),
      pmd.getString("popup.buttons.presenceStore"),
      pmd.getString("popup.presences.noPresences"),
      pmd.getString("popup.info.notConnected"),
      pmd.getString("popup.info.notConnected.message"),
      pmd.getString("popup.info.unsupportedAppVersion"),
      pmd.getString("popup.info.unsupportedAppVersion.message"),
      pmd.getString("popup.category.all"),
      pmd.getString("popup.category.anime"),
      pmd.getString("popup.category.music"),
      pmd.getString("popup.category.games"),
      pmd.getString("popup.category.socials"),
      pmd.getString("popup.category.videos"),
      pmd.getString("popup.category.other")
    ]).then(strings => {
      self.strings = {
        general: strings[0],
        presences: strings[1],
        manage: strings[2],
        load: strings[3],
        done: strings[4],
        presenceStore: strings[5],
        noPresences: strings[6],
        notConnected: strings[7],
        notConnectedMessage: strings[8],
        outdatedApp: strings[9],
        outdatedAppMessage: strings[10],
        categories: {
          all: strings[11],
          anime: strings[12],
          music: strings[13],
          games: strings[14],
          socials: strings[15],
          videos: strings[16],
          other: strings[17]
        }
      };

      if (this.strings.notConnectedMessage.match(/(\*.*?\*)/g))
        this.strings.notConnectedMessage.match(/(\*.*?\*)/g).map(ch => {
          this.strings.notConnectedMessage = this.strings.notConnectedMessage.replace(
            ch,
            `<a target="_blank" href="https://docs.premid.app/en/troubleshooting">${ch.slice(
              1,
              ch.length - 1
            )}</a>`
          );
        });
    });

    //* Get settings, filter language option for now, save in object
    this.settings = await new Promise(function(resolve) {
      chrome.storage.sync.get("settings", function(result) {
        Promise.all(
          Object.keys(result.settings).map(async key => {
            if (typeof result.settings[key].show === "undefined") return;

            result.settings[key].string = await pmd.getString(
              result.settings[key].string
            );
          })
        ).then(() => {
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
    this.presences = await new Promise(function(resolve) {
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
    window.addEventListener("keydown", () => {
      this.shiftPressed = event.shiftKey;
    });

    window.addEventListener("keyup", () => {
      this.shiftPressed = event.shiftKey;
    });
  },
  computed: {
    filterCategories() {
      let catFiltered = [];

      let catNames = Object.keys(this.categories).filter(cat => {
        if (cat === "all") return true;
        return this.presences.some(p => p.metadata.category === cat);
      });

      catNames.map(c => {
        this.categories[c].title = this.strings.categories[c];
        catFiltered.push(this.categories[c]);
      });

      return catFiltered;
    },
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
    <div v-if="!connected && supportedVersion" class="message-container message-container--error">
      <h1 class="message-container__title" v-text="strings.notConnected" />
      <p class="message-container__details" v-html="strings.notConnectedMessage" />
    </div>
    <div v-if="!supportedVersion" class="message-container message-container--outdated">
      <h1 class="message-container__title" v-text="strings.outdatedApp" />
      <p class="message-container__details" v-html="strings.outdatedAppMessage" />
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
        <a draggable="false" @click="categoriesShown = !categoriesShown" v-if="filteredPresences.length > 0 && (!shiftPressed || !connected) && !managePresences" class="manage-btn">
          <span><i class="fas fa-tag" /></span>
        </a>
        <a draggable="false" class="manage-btn" v-if="filteredPresences.length > 0 && (!shiftPressed || !connected) || managePresences" v-on:click="if(!managePresences)categoriesShown=false;managePresences=!managePresences;">
          <span v-if="!managePresences"><i class="fas fa-cog" /></span>
          <span v-else><i class="fas fa-check-circle" /></span>
        </a>
        <a draggable="false" class="manage-btn" v-if="!managePresences && shiftPressed && connected" v-on:click="loadLocalPresence">
          <p>{{strings.load}}</p>
        </a>
      </div>
      <transition name="scaleIn">
        <div v-show="categoriesShown" class="presence-categories">
          <a draggable="false" href="#" @click="currentCategory = category.id; localStorage.currentCategory = category.id;" class="presence-categories__label" :class="{ 'presence-categories__label--active': currentCategory == category.id }" v-for="category in filterCategories" :key="category.id"><i :class="'fas fa-' + category.icon" /> {{category.title}}</a>
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
    <a href="https://premid.app/store" target="_blank" class="button button--store" v-html="strings.presenceStore"/>
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
