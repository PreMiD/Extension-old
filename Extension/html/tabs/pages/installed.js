//* Settings View
Vue.component("installedView", {
  data: function() {
    return {
      strings: {
        general: "",
        presences: ""
      },
      settings: {},
      presences: [],
      connected: false
    };
  },
  created: async function() {
    this.strings = {
      general: await getString("popup.headings.general"),
      presences: await getString("popup.headings.presences")
    };

    setInterval(async () => {
      var self = this;
      self.connected = (await new Promise(function(resolve, reject) {
        chrome.storage.local.get("connected", resolve);
      })).connected;
    }, 100);
  },
  template: /* html */ `
  <mainBody heading="tab.installed.heading" subHeading="tab.installed.subHeading"></mainBody>
  `
});
