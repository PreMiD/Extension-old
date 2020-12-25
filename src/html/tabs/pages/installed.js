//* Settings View
Vue.component("installedView", {
  data: function() {
    return {
      error: this.$t("tab.installed.error"),
      connected: null
    };
  },
  created: function() {
    this.error = `<b>${this.error
      .match(/\*\*(.+?)\*\*/g)[0]
      .slice(
        2,
        this.error.match(/\*\*(.+?)\*\*/g)[0].length - 2
      )}</b> ${this.error.replace(/\*\*(.+?)\*\*/g, "")}`;

    const port = chrome.runtime.connect({ name: "tabs" });

    port.onMessage.addListener(msg => {
      this.connected = msg.connected;
    });
  },
  template: `
  <mainBody heading="tab.installed.heading" subHeading="tab.installed.subHeading">
    <div class="inline">
      <a draggable="false" class="button donate" target="_blank" href="https://patreon.com/Timeraa"><i class="fas fa-donate"/> {{$t('donate')}}</a>
      <a draggable="false" class="button discord" target="_blank" href="https://discord.premid.app"><i class="fab fa-discord"></i>Discord</a>
    </div>

      <div v-bind:class="{hidden: !this.connected}" ref="table">
        <a draggable="false" class="button start" target="_blank" href="https://premid.app" v-html="$t('tab.installed.start', {0: '<p class=pmd>PreMiD</p>'})"/>
      </div>
      <div v-bind:class="{hidden: this.connected}" v-if="!this.connected">
        <div id="error">
          <p v-html="this.error"></p>
          <a draggable="false" target="_blank" href="https://docs.premid.app/troubleshooting"><i class="fas fa-question"></i> {{$t('tab.installed.link.troubleshooting')}}</a>
          <a draggable="false" target="_blank" href="https://premid.app/downloads"><i class="fas fa-download"></i> {{$t('tab.installed.link.installApplication')}}</a>
        </div>
      </div>
  </mainBody>
  `
});
//* Settings View
Vue.component("installedView", {
  data: function() {
    return {
      error: this.$t("tab.installed.error"),
      connected: null
    };
  },
  created: function() {
    this.error = `<b>${this.error
      .match(/\*\*(.+?)\*\*/g)[0]
      .slice(
        2,
        this.error.match(/\*\*(.+?)\*\*/g)[0].length - 2
      )}</b> ${this.error.replace(/\*\*(.+?)\*\*/g, "")}`;

    const port = chrome.runtime.connect({ name: "tabs" });

    port.onMessage.addListener(msg => {
      this.connected = msg.connected;
    });
  },
  template: `
  <mainBody heading="tab.installed.heading" subHeading="tab.installed.subHeading">
    <div class="inline">
      <a draggable="false" class="button donate" target="_blank" href="https://patreon.com/Timeraa"><i class="fas fa-donate"/> {{$t('donate')}}</a>
      <a draggable="false" class="button discord" target="_blank" href="https://discord.premid.app"><i class="fab fa-discord"></i>Discord</a>
    </div>

      <div v-bind:class="{hidden: !this.connected}" ref="table">
        <a draggable="false" class="button start" target="_blank" href="https://premid.app" v-html="$t('tab.installed.start', {0: '<p class=pmd>PreMiD</p>'})"/>
      </div>
      <div v-bind:class="{hidden: this.connected}" v-if="!this.connected">
        <div id="error">
          <p v-html="this.error"></p>
          <a draggable="false" target="_blank" href="https://docs.premid.app/troubleshooting"><i class="fas fa-question"></i> {{$t('tab.installed.link.troubleshooting')}}</a>
          <a draggable="false" target="_blank" href="https://premid.app/downloads"><i class="fas fa-download"></i> {{$t('tab.installed.link.installApplication')}}</a>
        </div>
      </div>
  </mainBody>
  `
});
