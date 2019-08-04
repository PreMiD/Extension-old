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
    this.strings.heading = await getString(this.heading);
    this.strings.subHeading = (await getString(this.subHeading)).replace(
      "{0}",
      '<p class="pmd">PreMiD</p>'
    );
  },
  template: /*html*/ `
	<div id="mainWrapper">
    <div id="mainContent">
      <img draggable="false" src="../../../assets/images/icon_infill.svg">
      <h1>{{this.strings.heading}}</h1>
      <h2 v-html="this.strings.subHeading"></h2>
      <slot></slot>
    </div>
  </div>`
});
