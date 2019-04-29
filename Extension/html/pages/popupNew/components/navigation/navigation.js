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
	<div id="navigation">
		<img src="../../../../assets/images/icon124px.png" draggable="false">
		
		<ul class="tabs">
			<li class="tab"><router-link to='/settings' class="active" draggable='false'>{{this.settings}}</router-link></li>
			<li class="tab"><router-link to='/credits' draggable='false'>{{this.credits}}</router-link></li>
		</ul>
	</div>`
});
