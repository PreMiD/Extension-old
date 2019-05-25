//* Navigation header
Vue.component("mainBody", {
  data: function() {
    return {
      strings: {
        heading: null,
        subHeading: null,
        donate: null,
        start: null
      }
    };
  },
  props: ["heading", "subHeading"],
  created: async function() {
    this.strings.heading = await getString(this.heading);
    this.strings.subHeading = (await getString(this.subHeading)).replace(
      "{0}",
      '<p class="pmd">PreMiD</p>'
    );
    this.strings.donate = await getString("donate");
    this.strings.start = (await getString("tab.installed.start")).replace(
      "{0}",
      '<p class="pmd">PreMiD</p>'
    );
  },
  template: /*html*/ `
	<div id="mainWrapper">
    <div id="mainContent">
      <img draggable="false" src="../../../assets/images/Icon_BlueFill.svg">
      <h1>{{this.strings.heading}}</h1>
      <h2 v-html="this.strings.subHeading"></h2>
      
      <div class="inline">
        <a draggable="false" class="button donate" target="_blank" href="https://patreon.com/Timeraa"><i class="fas fa-donate"></i> {{this.strings.donate}}</a>
        <a draggable="false" class="button discord" target="_blank" href="https://discord.premid.app"><i class="fab fa-discord"></i> Discord</a>
      </div>

      <a draggable="false" class="button start" target="_blank" href="https://discord.premid.app" v-html="this.strings.start"></a>
    </div>
  </div>`
});
