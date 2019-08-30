Vue.component("creditCard", {
  props: ["user"],
  template: `
	<div class="creditCard" :style="'background: linear-gradient(45deg,'+this.user.roleColor+' 0%, #23272A 100%)'">
    <h1 v-text="this.user.name.length > 16 ? this.user.name.slice(0, 15) + '...' : this.user.name"/>
    <h2 v-html="this.user.role.replace(' ', \`<p style='display:inline;line-height:0;'>&nbsp;</p>\`)"/>
    <span :class="this.user.status"/>
    <img :src="this.user.avatar + '?size=128'" draggable="false">
  </div>`
});
