//* Navigation header
Vue.component("change", {
  data: function() {
    return {
      text: null,
      type: null
    };
  },
  created: async function() {
    switch (this.change.type) {
      case "new":
        this.type = await pmd.getString("tab.updated.new");
        break;
      case "change":
        this.type = await pmd.getString("tab.updated.changed");
        break;
      case "fix":
        this.type = await pmd.getString("tab.updated.fixed");
        break;
    }

    var text = this.change.text;
    if (this.change.text.match(/(\[.*?\])/g) != null)
      this.change.text.match(/(\[.*?\])/g).map((ch, i) => {
        text = text.replace(
          ch,
          `<a target="_blank" href="${this.change.urls[i]}">${ch.slice(
            1,
            ch.length - 1
          )}</a>`
        );
      });

    this.text = text;
  },
  props: ["change"],
  template: /*html*/ `
	<div id="changeItem">
    <div id="badge" v-bind:class="this.change.type">
      <p v-text="this.type"></p>
    </div>
    <p id="text" v-html="this.text"/>
  </div>`
});
