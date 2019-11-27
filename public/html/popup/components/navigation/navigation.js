//* Navigation header
Vue.component("navigation", {
  template: `
	<div>
		<div class="navbar">
			<div class="logo">
				<img src="../../../../assets/images/icon.svg" draggable="false">
			</div>
			<div class="links">
				<router-link to='/settings' class="active" draggable='false' v-t="'popup.navigation.settings'"/>
				<router-link to='/credits' draggable='false' v-t="'popup.navigation.credits'"/>
			</div>
		</div>
	</div>`
});
