//* Navigation header
Vue.component("mainBody", {
  props: ["heading", "subHeading"],
  template: `
	<div id="mainWrapper">
    <div id="mainContent">
      <div id="main">
        <img draggable="false" src="../../../assets/images/icon.svg">
        <h1>{{$t(heading)}}</h1>
        <h2 v-html="$t(subHeading, {0: '<p class=pmd>PreMiD</p>'})" />
      </div>
      <div id="buttons">
        <slot></slot>
      </div>
    </div>
  </div>`
});
