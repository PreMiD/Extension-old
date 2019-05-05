//* Navigation header
Vue.component('navigation', {
	data: function() {
		return {
			settings: null,
			credits: 'null'
		};
	},
	created: async function() {
		this.settings = await getString('popup.navigation.settings');
		this.credits = await getString('popup.navigation.credits');
	},
	template: /*html*/ `
	<div class="pmd_navbar">
		<div class="navbar__items">
			<router-link to='/settings' class="active" draggable='false'>{{this.settings}}</router-link>
			<router-link to='/credits' draggable='false'>{{this.credits}}</router-link>
		</div>
	</div>`
});
