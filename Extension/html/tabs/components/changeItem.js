//* Navigation header
Vue.component("change", {
  data: function() {
    return {
      new: null,
      fixed: null,
      changed: null
    };
  },
  created: async function() {
    this.new = await getString("tab.updated.new");
    this.fixed = await getString("tab.updated.fixed");
    this.changed = await getString("tab.updated.changed");
  },
  props: ["type"],
  template: /*html*/ `
	<div id="changeItem">
    <div id="badge" v-bind:class="this.type">
      <p v-if="this.type == 'new'">{{this.new}}</p>
      <p v-if="this.type == 'change'">{{this.changed}}</p>
      <p v-if="this.type == 'fix'">{{this.fixed}}</p>
    </div>
    <p id="text"><slot/></p>
  </div>`
});
