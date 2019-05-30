//* Settings View
Vue.component("updatedView", {
  data: function() {
    return {
      strings: {
        donate: null,
        start: null
      },
      settings: {},
      presences: [],
      connected: false
    };
  },
  created: async function() {
    this.strings.donate = await getString("donate");
    this.strings.start = (await getString("tab.installed.start")).replace(
      "{0}",
      '<p class="pmd">PreMiD</p>'
    );

    setInterval(async () => {
      var self = this;
      self.connected = (await new Promise(function(resolve, reject) {
        chrome.storage.local.get("connected", resolve);
      })).connected;
    }, 100);
  },
  template: /* html */ `
  <mainBody heading="tab.installed.heading" subHeading="tab.installed.subHeading">
    <div class="inline">
      <a draggable="false" class="button donate" target="_blank" href="https://patreon.com/Timeraa"><i class="fas fa-donate"></i> {{this.strings.donate}}</a>
      <a draggable="false" class="button discord" target="_blank" href="https://discord.premid.app"><i class="fab fa-discord"></i> Discord</a>
    </div>

    <a draggable="false" class="button start" target="_blank" href="https://discord.premid.app" v-html="this.strings.start"></a>
  </mainBody>
  `
});
