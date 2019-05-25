//* Navigation header
Vue.component("heading", {
  data: function() {
    return {
      settings: null,
      credits: null,
      version: null
    };
  },
  created: async function() {
    this.settings = await getString("popup.navigation.settings");
    this.credits = await getString("popup.navigation.credits");
    this.version = await chrome.runtime.getManifest().version;
  },
  template: /*html*/ `
	<div id="header">
    <div id="left">
      <h1>PreMiD</h1>
      <h2 id="version">V{{this.version}}</h2>
    </div>
    <div id="right">
      <a draggable="false" target="_blank" href="https://github.com/PreMiD/PreMiD"><i class="fab fa-github"></i> GitHub</a>
      <a draggable="false"><i class="fas fa-history"></i> Changelog</a>
      <a draggable="false" target="_blank" href="https://wiki.premid.app/"><i class="fas fa-book"></i> Wiki</a>
    </div>
	</div>`
});
