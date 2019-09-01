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
      changelog: []
    };
  },
  created: async function() {
    this.strings.donate = await pmd.getString("donate");
    this.strings.start = (await pmd.getString("tab.installed.start")).replace(
      "{0}",
      '<p class="pmd">PreMiD</p>'
    );

    this.changelog = await Promise.all(
      (await pmd.fetchJSON(
        `https://api.premid.app/v2/changelog/extension/${
          chrome.runtime.getManifest().version
        }`
      )).map(async ch => {
        return {
          type: ch.type,
          text: await pmd.getString(ch.string),
          urls: ch.urls
        };
      })
    );
  },
  template: `
  <mainBody heading="tab.updated.heading" subHeading="tab.updated.subHeading">
    <div class="inline">
      <a draggable="false" class="button donate" target="_blank" href="https://patreon.com/Timeraa"><i class="fas fa-donate"></i> {{this.strings.donate}}</a>
      <a draggable="false" class="button discord" target="_blank" href="https://discord.premid.app"><i class="fab fa-discord"></i>Discord</a>
    </div>

    <div id="updates">
      <change v-for="change in changelog" :change="change"/>
    </div>
  </mainBody>
  `
});
