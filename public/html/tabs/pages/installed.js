//* Settings View
Vue.component("installedView", {
  data: function() {
    return {
      strings: {
        donate: null,
        start: null,
        error: null,
        troubleshooting: null,
        installApplication: null
      },
      connected: null
    };
  },
  created: async function() {
    this.strings.donate = await pmd.getString("donate");
    this.strings.start = (await pmd.getString("tab.installed.start")).replace(
      "{0}",
      '<p class="pmd">PreMiD</p>'
    );
    this.strings.error = await pmd.getString("tab.installed.error");
    this.strings.error = `<b>${this.strings.error
      .match(/\*\*(.+?)\*\*/g)[0]
      .slice(
        2,
        this.strings.error.match(/\*\*(.+?)\*\*/g)[0].length - 2
      )}</b> ${this.strings.error.replace(/\*\*(.+?)\*\*/g, "")}`;
    this.strings.troubleshooting = await pmd.getString(
      "tab.installed.link.troubleshooting"
    );
    this.strings.installApplication = await pmd.getString(
      "tab.installed.link.installApplication"
    );

    chrome.runtime.sendMessage({ tabs: true });
    chrome.runtime.onMessage.addListener(msg => {
      if (typeof msg.socket !== "undefined") this.connected = msg.socket;
    });
  },
  template: /* html */ `
  <mainBody heading="tab.installed.heading" subHeading="tab.installed.subHeading">
    <div class="inline">
      <a draggable="false" class="button donate" target="_blank" href="https://patreon.com/Timeraa"><i class="fas fa-donate"></i> {{this.strings.donate}}</a>
      <a draggable="false" class="button discord" target="_blank" href="https://discord.premid.app"><i class="fab fa-discord"></i> Discord</a>
    </div>

    <transition name="fade">
      <div v-if="this.connected">
        <a draggable="false" class="button start" target="_blank" href="https://beta.premid.app" v-html="this.strings.start"></a>
      </div>
    </transition>
    <transition name="fade">
      <div v-bind:class="{hidden: this.connected == null}" v-if="!this.connected">
        <div id="error">
          <p v-html="this.strings.error"></p>
          <a draggable="false" target="_blank" href="https://wiki.premid.app/troubleshooting/troubleshooting"><i class="fas fa-question"></i> {{this.strings.troubleshooting}}</a>
          <a draggable="false" target="_blank" href="https://premid.app/downloads"><i class="fas fa-download"></i> {{this.strings.installApplication}}</a>
        </div>
      </div>
    </transition>
  </mainBody>
  `
});
