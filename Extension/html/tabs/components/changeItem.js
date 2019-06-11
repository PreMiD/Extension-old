//* Navigation header
Vue.component("change", {
  props: ["type"],
  template: /*html*/ `
	<div id="changeItem">
    <div id="badge" v-bind:class="this.type">
      <p v-if="this.type == 'new'">NEW</p>
      <p v-if="this.type == 'fixed'">FIXED</p>
    </div>
    <p id="text"><slot/></p>
  </div>`
});
