//* Navigation header
Vue.component("heading", {
  data: function() {
    return {
      version: null
    };
  },
  created: function() {
    this.version = chrome.runtime.getManifest().version_name;
  },
  template: `
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
      <a draggable="false" target="_blank" href="https://docs.premid.app/"><i class="fas fa-book"></i> {{$t('tab.button.wiki')}}</a>
    </div>
	</div>`
});
