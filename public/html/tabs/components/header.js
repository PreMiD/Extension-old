//* Navigation header
Vue.component("heading", {
  data: function() {
    return {
      settings: null,
      credits: null,
      changelog: null,
      wiki: null,
      version: null
    };
  },
  created: async function() {
    this.settings = await pmd.getString("popup.navigation.settings");
    this.credits = await pmd.getString("popup.navigation.credits");
    this.wiki = await pmd.getString("tab.button.wiki");
    this.changelog = await pmd.getString("tab.button.changelog");
    this.version = await chrome.runtime.getManifest().version_name;
  },
  template: /*html*/ `
	<div id="header">
    <div id="left">
      <h1>PreMiD</h1>
      <h2 id="version">V{{this.version}}</h2>
    </div>
    <div id="right">
      <a draggable="false" target="_blank" href="https://github.com/PreMiD/PreMiD"><i class="fab fa-github"></i> GitHub</a>
      <!--
        TODO Add changelog on website?
        <a draggable="false"><i class="fas fa-history"></i> {{this.changelog}}</a>
      -->
      <a draggable="false" target="_blank" href="https://wiki.premid.app/"><i class="fas fa-book"></i> {{this.wiki}}</a>
    </div>
	</div>`
});
