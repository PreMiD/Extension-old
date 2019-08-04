//* Navigation header
Vue.component("navigation", {
  data: function() {
    return {
      settings: null,
      credits: null
    };
  },
  created: async function() {
    this.settings = await getString("popup.navigation.settings");
    this.credits = await getString("popup.navigation.credits");
  },
  template: /*html*/ `
	<div>
		<div class="navbar">
			<div class="logo">
				<img src="../../../../assets/images/icon_infill.svg" draggable="false">
			</div>
			
			<div class="links">
				<router-link to='/settings' class="active" draggable='false' v-text="settings"/>
				<router-link to='/credits' draggable='false' v-text="credits"/>
			</div>
		</div>
	</div>`
});
