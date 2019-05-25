//* Settings View
Vue.component("creditsView", {
  data: function() {
    return {
      credits: []
    };
  },
  created: async function() {
    this.credits = await fetchJSON("https://api.premid.app/credits");
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
    }
  },
  template: /* html */ `
  <div class="pmd_settings">
    <div class="container__setting" v-for="(value, key) in credits">
      {{value.name}}
    </div>
  </div>`
});
