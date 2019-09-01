//* Navigation header
Vue.component("mainBody", {
  data: function() {
    return {
      strings: {
        heading: null,
        subHeading: null
      }
    };
  },
  props: ["heading", "subHeading"],
  created: async function() {
    this.strings.heading = await pmd.getString(this.heading);
    this.strings.subHeading = (await pmd.getString(this.subHeading)).replace(
      "{0}",
      '<p class="pmd">PreMiD</p>'
    );
  },
  template: `
	<div id="mainWrapper">
    <div id="mainContent">
      <div id="main">
        <img draggable="false" src="../../../assets/images/icon.svg">
        <h1>{{this.strings.heading}}</h1>
        <h2 v-html="this.strings.subHeading"></h2>
      </div>
      <div id="buttons">
        <slot></slot>
      </div>
    </div>
  </div>`
});
